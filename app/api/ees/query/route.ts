import { NextResponse } from "next/server";
import { eesBase, assertDataSetId } from "@/lib/ees";

export async function POST(req: Request) {
  try {
    
    const { searchParams } = new URL(req.url);
    const dataSetId = searchParams.get("dataSetId");
    assertDataSetId(dataSetId);

    // Optional: EES supports dataSetVersion as a query param for query endpoint. :contentReference[oaicite:4]{index=4}
    const dataSetVersion = searchParams.get("dataSetVersion");

    const body = await req.json(); // { criteria, indicators, sorts, page, pageSize, debug ... }

    const url = new URL(`${eesBase()}/data-sets/${dataSetId}/query`);
    if (dataSetVersion) url.searchParams.set("dataSetVersion", dataSetVersion);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // required by EES :contentReference[oaicite:5]{index=5}
      body: JSON.stringify(body),
    });

    const text = await res.text();
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