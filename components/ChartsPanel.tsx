"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Plot from "@observablehq/plot";

import { fetchEesMeta } from "@/lib/eesClient";
import { fetchEesTrend } from "@/lib/fetchEesTrend";
import type { SelectedIndicator, SelectedLocation, SelectedTimePeriod } from "@/components/SchoolTable";

type Props = {
  dataSetId: string;
  indicator: SelectedIndicator | null;
  timePeriod: SelectedTimePeriod | null;
  location: SelectedLocation | null;
};

function renderMessage(container: HTMLDivElement, text: string, isError = false) {
  const p = document.createElement("p");
  p.className = isError ? "plot-message is-error" : "plot-message";
  p.textContent = text;
  container.appendChild(p);
}

export default function ChartsPanel({ dataSetId, indicator, location }: Props) {
  const plotRef = useRef<HTMLDivElement | null>(null);

  const metaQuery = useQuery({
    queryKey: ["eesMeta"],
    queryFn: fetchEesMeta,
    staleTime: 60 * 60 * 1000,
  });

  const chartTimePeriods = useMemo(() => {
    const timePeriods = (metaQuery.data?.timePeriods ?? []) as Array<{
      code: string;
      period: string;
      label?: string;
    }>;
    const normalized = timePeriods.map((tp) => ({
      code: tp.code,
      period: tp.period,
      label: tp.label,
    }));

    return normalized.slice(-10);
  }, [metaQuery.data]);

  const trendQuery = useQuery({
    queryKey: ["eesTrend", dataSetId, indicator?.id, location?.level, location?.code, chartTimePeriods],
    queryFn: () =>
      fetchEesTrend({
        dataSetId,
        indicator: indicator!,
        location: location!,
        timePeriods: chartTimePeriods,
      }),
    enabled: !!indicator && !!location && chartTimePeriods.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!plotRef.current) return;
    plotRef.current.innerHTML = "";

    const raw = trendQuery.data ?? [];
    const points = raw.filter((d) => d.value !== null);

    if (!trendQuery.data || trendQuery.data.length === 0) {
      renderMessage(plotRef.current, "No results returned for this indicator and location.");
      return;
    }

    if (points.length === 0) {
      renderMessage(plotRef.current, "No numeric values were found to plot.", true);
      return;
    }

    const width = Math.max(320, Math.min(980, plotRef.current.clientWidth - 8));

    const chart = Plot.plot({
      width,
      height: 370,
      marginLeft: 72,
      marginBottom: 58,
      x: { label: "Time period", tickRotate: -25 },
      y: { label: indicator?.label ?? "Value", grid: true },
      style: { background: "transparent", color: "#0f172a" },
      marks: [
        Plot.line(points, { x: "period", y: "value", stroke: "#0f766e", strokeWidth: 2.6 }),
        Plot.dot(points, { x: "period", y: "value", fill: "#b45309", r: 3.6 }),
      ],
    });

    plotRef.current.appendChild(chart);
    return () => chart.remove();
  }, [trendQuery.data, indicator?.label]);

  if (!indicator || !location) {
    return (
      <div className="status-card">
        Select an <b>indicator</b> and a <b>location</b> to view a trend chart.
      </div>
    );
  }

  if (metaQuery.isLoading) return <p className="status-text">Loading chart metadata...</p>;
  if (metaQuery.error) return <p className="status-text status-error">Meta error: {(metaQuery.error as Error).message}</p>;
  if (trendQuery.isLoading) return <p className="status-text">Loading trend data...</p>;
  if (trendQuery.error) return <p className="status-text status-error">Trend error: {(trendQuery.error as Error).message}</p>;

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <h2>Trend overview</h2>
        <p>
          Latest {chartTimePeriods.length} periods for <b>{indicator.label}</b> in{" "}
          <b>{location.label ?? location.code}</b>.
        </p>
      </div>

      <div ref={plotRef} className="plot-surface" />

      {trendQuery.data?.some((d) => d.value === null) ? (
        <p className="chart-note">Some time periods had no value and were excluded from the line.</p>
      ) : null}
    </section>
  );
}
