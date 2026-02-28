import { DATASET_ID } from "@/lib/dataset";

export async function fetchEesMeta() {
  const url =
    `/api/ees/meta?dataSetId=${DATASET_ID}` +
    `&types=Filters&types=Indicators&types=Locations&types=TimePeriods`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meta fetch failed: ${res.status}`);

  console.log("EES META RESPONSE:", res);

  return res.json();
}

export async function fetchEesPage(body: any) {
  const url = `/api/ees/query?dataSetId=${DATASET_ID}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Query failed: ${res.status} ${msg}`);
  }

  console.log("EES META RESPONSE:", res);
  
  return res.json();
}