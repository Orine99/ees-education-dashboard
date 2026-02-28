export function eesBase() {
  const base = process.env.EES_API_BASE;
  if (!base) throw new Error("Missing EES_API_BASE in .env.local");
  return base.replace(/\/$/, "");
}

export function assertDataSetId(dataSetId: string | null): asserts dataSetId is string {
  if (!dataSetId || dataSetId.trim().length === 0) {
    throw new Error("Missing required query param: dataSetId");
  }
}