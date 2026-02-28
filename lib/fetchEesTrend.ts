import type { SelectedIndicator, SelectedLocation } from "@/components/SchoolTable";

export type TrendPoint = {
  period: string; // e.g. "2019/20"
  value: number | null;
};

export async function fetchEesTrend(params: {
  dataSetId: string;
  indicator: SelectedIndicator;
  location: SelectedLocation;
  timePeriods: { code: string; period: string; label?: string }[];
}): Promise<TrendPoint[]> {
  const body: any = {
    indicators: [params.indicator.id],
    criteria: {
      and: [
        {
          locations: {
            eq: { level: params.location.level, code: params.location.code },
          },
        },
        {
          timePeriods: {
            in: params.timePeriods.map((tp) => ({ code: tp.code, period: tp.period })),
          },
        },
      ],
    },
    page: 1,
    pageSize: 2000,
    debug: true,
  };

  const res = await fetch(`/api/ees/query?dataSetId=${params.dataSetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Trend query failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  const results = (data.results ?? data.data ?? []) as any[];

  // Robust value extraction:
  // - sometimes values[indicator.id]
  // - sometimes values[indicator.column]
  // - sometimes values is { RandomKey: 'indicator_column: "1.27"' }
  const readValue = (r: any): number | null => {
    const values = r?.values ?? {};

    // Try common keyed forms first
    let raw =
      values[params.indicator.id] ??
      values[params.indicator.column] ??
      values[String(params.indicator.id)] ??
      values[String(params.indicator.column)];

    // If not found, take the first value in the object (common in EES responses)
    if (raw === undefined) {
      raw = Object.values(values)[0];
    }

    if (raw === null || raw === undefined || raw === "") return null;

    // If already numeric
    if (typeof raw === "number") {
      return Number.isFinite(raw) ? raw : null;
    }

    // If string, try to extract number inside quotes: something: "1.27"
    if (typeof raw === "string") {
      const match = raw.match(/"(-?\d+(\.\d+)?)"/);
      if (match) return Number(match[1]);

      // Fallback: maybe it's just "1.27"
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }

    return null;
  };

  // Optional debugging (keep for now)
  if (results.length > 0) {
    console.log("Trend firstResult.values keys:", Object.keys(results[0]?.values ?? {}));
    console.log("Trend firstResult.values:", results[0]?.values);
  }

  return results.map((r) => ({
    period: r?.timePeriod?.label ?? r?.timePeriod?.period ?? "unknown",
    value: readValue(r),
  }));
}