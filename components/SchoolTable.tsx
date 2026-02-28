"use client";

import "@/lib/agGridModules";
import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, IDatasource, IGetRowsParams } from "ag-grid-community";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEesPage } from "@/lib/fetchEesPage";

type Sort = { colId: string; sort: "asc" | "desc" } | null;

export type SelectedIndicator = {
  id: string;
  column: string;
  label: string;
  decimalPlaces?: number;
};

export type SelectedTimePeriod = {
  code: string;
  period: string;
  label?: string;
};

export type SelectedLocation = {
  level: string;
  code: string;
  id?: string;
  label?: string;
  oldCode?: string;
};

type Props = {
  dataSetId: string;
  indicator: SelectedIndicator | null;
  timePeriod: SelectedTimePeriod | null;
  location: SelectedLocation | null;
};

type EesRow = {
  values?: Record<string, unknown>;
  locations?: Record<string, string>;
  location?: { label?: string };
  timePeriod?: { label?: string; period?: string };
};

function extractEesValue(row: EesRow): number | string | null {
  const valuesObj = row?.values ?? {};
  const vals = Object.values(valuesObj);
  if (vals.length === 0) return null;

  const first = vals[0];
  if (typeof first === "number") return first;

  if (typeof first === "string") {
    const match = first.match(/"(-?\d+(\.\d+)?)"/);
    if (match) return Number(match[1]);
    return first;
  }

  return null;
}

export default function SchoolTable({ dataSetId, indicator, timePeriod, location }: Props) {
  const queryClient = useQueryClient();
  const hasSelections = Boolean(indicator && timePeriod && location);

  const columnDefs = useMemo<ColDef[]>(
    () => {
      if (!indicator) {
        return [
          { field: "location", headerName: "Location" },
          { field: "timePeriod", headerName: "Time period" },
          { field: "value", headerName: "Value" },
        ];
      }

      return [
        { field: "location", headerName: "Location", sortable: true },
        { field: "timePeriod", headerName: "Time period", sortable: true },
        {
          field: "value",
          headerName: indicator.label,
          sortable: true,
          valueFormatter: (params) => {
            const value = params.value;
            if (value === null || value === undefined || value === "") return "";

            const dp = indicator.decimalPlaces ?? 2;
            const num = Number(value);
            if (Number.isNaN(num)) return String(value);

            return num.toFixed(dp);
          },
        },
      ];
    },
    [indicator]
  );

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        if (!hasSelections) {
          params.successCallback([], 0);
          return;
        }

        try {
          const selectedIndicator = indicator!;
          const selectedTimePeriod = timePeriod!;
          const selectedLocation = location!;

          const startRow = params.startRow ?? 0;
          const endRow = params.endRow ?? 50;
          const pageSize = endRow - startRow;
          const page = Math.floor(startRow / pageSize) + 1;

          const sortModel = params.sortModel?.[0] ?? null;
          let sort: Sort = null;

          if (sortModel?.colId && sortModel.sort) {
            sort = { colId: sortModel.colId, sort: sortModel.sort as "asc" | "desc" };
          }

          const queryKey = [
            "eesRows",
            dataSetId,
            selectedIndicator.id,
            selectedIndicator.column,
            selectedTimePeriod.code,
            selectedTimePeriod.period,
            selectedLocation.level,
            selectedLocation.code,
            page,
            pageSize,
            sort,
          ];

          const data = await queryClient.fetchQuery({
            queryKey,
            queryFn: () =>
              fetchEesPage({
                dataSetId,
                page,
                pageSize,
                sort,
                indicatorId: selectedIndicator.id,
                location: {
                  level: selectedLocation.level,
                  code: selectedLocation.code,
                  label: selectedLocation.label,
                  oldCode: selectedLocation.oldCode,
                },
                timePeriod: {
                  code: selectedTimePeriod.code,
                  period: selectedTimePeriod.period,
                  label: selectedTimePeriod.label,
                },
              }),
            staleTime: 5 * 60 * 1000,
          });

          const rows = (data.rows ?? []).map((row: EesRow) => {
            const locLabel =
              row.locations?.[selectedLocation.level] ??
              row.locations?.LA ??
              row.location?.label ??
              selectedLocation.label ??
              selectedLocation.code;

            const tpLabel =
              row.timePeriod?.label ??
              row.timePeriod?.period ??
              selectedTimePeriod.label ??
              selectedTimePeriod.period;

            return {
              location: locLabel,
              timePeriod: tpLabel,
              value: extractEesValue(row),
              raw: row,
            };
          });

          params.successCallback(rows, data.total);
        } catch (err) {
          console.error("Grid getRows error:", err);
          params.failCallback();
        }
      },
    }),
    [queryClient, dataSetId, hasSelections, indicator, timePeriod, location]
  );

  if (!hasSelections) {
    return (
      <div className="status-card">
        Select an <b>indicator</b>, <b>time period</b>, and <b>location</b> to load table data.
      </div>
    );
  }

  return (
    <div className="table-shell ag-theme-quartz">
      <AgGridReact
        columnDefs={columnDefs}
        rowModelType="infinite"
        datasource={datasource}
        cacheBlockSize={50}
        maxBlocksInCache={10}
        rowHeight={42}
        theme="legacy"
      />
    </div>
  );
}
