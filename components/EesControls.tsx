"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEesMeta } from "@/lib/eesClient";
import type {
  SelectedIndicator,
  SelectedLocation,
  SelectedTimePeriod,
} from "./SchoolTable";

type Props = {
  indicator: SelectedIndicator | null;
  timePeriod: SelectedTimePeriod | null;
  location: SelectedLocation | null;
  setIndicator: (v: SelectedIndicator) => void;
  setTimePeriod: (v: SelectedTimePeriod) => void;
  setLocation: (v: SelectedLocation) => void;
};

type MetaIndicator = {
  id: string;
  column: string;
  label?: string;
  decimalPlaces?: number;
};

type MetaTimePeriod = {
  code: string;
  period: string;
  label?: string;
};

type MetaLocationOption = {
  id?: string;
  label?: string;
  code: string;
  oldCode?: string;
  level?: string;
  levelLabel?: string;
};

type MetaLocationGroup = {
  level?: { code?: string; label?: string };
  options?: MetaLocationOption[];
};

function flattenLocations(locationsRaw: unknown): MetaLocationOption[] {
  if (!locationsRaw) return [];

  if (Array.isArray(locationsRaw)) {
    const groups = locationsRaw as MetaLocationGroup[];
    const looksGrouped =
      groups.length > 0 &&
      groups[0]?.level?.code &&
      Array.isArray(groups[0]?.options);

    if (looksGrouped) {
      return groups.flatMap((group) => {
        const levelCode = String(group.level?.code ?? "UNKNOWN");
        const levelLabel = String(group.level?.label ?? "");
        const opts = Array.isArray(group.options) ? group.options : ([] as MetaLocationOption[]);

        return opts.map((option) => ({
          ...option,
          level: levelCode,
          levelLabel,
        }));
      });
    }

    return groups as MetaLocationOption[];
  }

  if (typeof locationsRaw === "object") {
    return Object.values(locationsRaw as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? (value as MetaLocationOption[]) : []))
      .filter(Boolean);
  }

  return [];
}

export default function EesControls({
  indicator,
  timePeriod,
  location,
  setIndicator,
  setTimePeriod,
  setLocation,
}: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["eesMeta"],
    queryFn: fetchEesMeta,
    staleTime: 60 * 60 * 1000,
  });

  const indicators = useMemo(() => (data?.indicators ?? []) as MetaIndicator[], [data]);
  const timePeriods = useMemo(() => (data?.timePeriods ?? []) as MetaTimePeriod[], [data]);
  const locations = useMemo(() => flattenLocations(data?.locations), [data]);

  if (isLoading) return <p className="status-text">Loading metadata...</p>;
  if (error) return <p className="status-text status-error">Metadata error: {(error as Error).message}</p>;

  return (
    <div className="controls-grid">
      <label className="control-field">
        <span className="control-label">Indicator</span>
        <select
          className="control-select"
          aria-label="Indicator"
          value={indicator?.id ?? ""}
          onChange={(e) => {
            const found = indicators.find((x) => x.id === e.target.value);
            if (!found) return;

            setIndicator({
              id: found.id,
              column: found.column,
              label: found.label ?? found.id,
              decimalPlaces: found.decimalPlaces ?? 0,
            });
          }}
        >
          <option value="" disabled>
            Select indicator
          </option>
          {indicators.map((item) => (
            <option key={`indicator-${item.id}`} value={item.id}>
              {item.label ?? item.id}
            </option>
          ))}
        </select>
      </label>

      <label className="control-field">
        <span className="control-label">Time period</span>
        <select
          className="control-select"
          aria-label="Time period"
          value={timePeriod ? `${timePeriod.code}|${timePeriod.period}` : ""}
          onChange={(e) => {
            const key = e.target.value;
            const found = timePeriods.find((item) => `${item.code}|${item.period}` === key);
            if (!found) return;

            setTimePeriod({
              code: found.code,
              period: found.period,
              label: found.label,
            });
          }}
        >
          <option value="" disabled>
            Select time period
          </option>
          {timePeriods.map((item) => (
            <option key={`tp-${item.code}-${item.period}`} value={`${item.code}|${item.period}`}>
              {item.label ?? `${item.period} (${item.code})`}
            </option>
          ))}
        </select>
      </label>

      <label className="control-field">
        <span className="control-label">Location</span>
        <select
          className="control-select"
          aria-label="Location"
          value={location ? `${location.level}|${location.code}` : ""}
          onChange={(e) => {
            const [lvl, code] = e.target.value.split("|");
            if (!code) return;

            const found = locations.find(
              (item) => String(item.level) === String(lvl) && String(item.code) === String(code)
            );
            if (!found) return;

            setLocation({
              level: String(lvl),
              code: found.code,
              id: found.id,
              label: found.label ?? found.code,
              oldCode: found.oldCode,
            });
          }}
        >
          <option value="" disabled>
            Select location
          </option>
          {locations.map((item, idx) => {
            const lvl = String(item.level ?? "UNKNOWN");
            const levelLabel = String(item.levelLabel ?? "");
            const code = String(item.code ?? "");
            const id = String(item.id ?? item.oldCode ?? idx);
            const key = `loc-${lvl}-${code}-${id}-${idx}`;

            return (
              <option key={key} value={`${lvl}|${code}`}>
                {item.label ?? code} ({levelLabel} {lvl})
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
