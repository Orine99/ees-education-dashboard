import { NextResponse } from "next/server";
import { eesBase, assertDataSetId } from "@/lib/ees";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dataSetId = searchParams.get("dataSetId");
    assertDataSetId(dataSetId);

    // Optional: pass-through supported query params
    // EES supports `types` and `dataSetVersion` for the meta endpoint. :contentReference[oaicite:2]{index=2}
    const types = searchParams.getAll("types"); // e.g. Filters, Indicators, Locations, TimePeriods
    const dataSetVersion = searchParams.get("dataSetVersion");

    const url = new URL(`${eesBase()}/data-sets/${dataSetId}/meta`);
    for (const t of types) url.searchParams.append("types", t);
    if (dataSetVersion) url.searchParams.set("dataSetVersion", dataSetVersion);

    const res = await fetch(url.toString(), { method: "GET" });

    const text = await res.text(); // keep raw for easier debugging
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}