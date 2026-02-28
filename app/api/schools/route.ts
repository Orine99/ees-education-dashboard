import { NextResponse } from "next/server";

function makeRows(total: number) {
  return Array.from({ length: total }).map((_, i) => ({
    id: i + 1,
    schoolName: `School ${i + 1}`,
    region: ["London", "Midlands", "North West", "South East"][i % 4],
    year: ["2022", "2023", "2024"][i % 3],
    value: Math.round(Math.random() * 100),
  }));
}

const ALL = makeRows(5000); // big dataset (don’t send it all to client!)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");

  const sortBy = searchParams.get("sortBy") ?? "id";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

  // Simulate server sorting
  const sorted = [...ALL].sort((a: any, b: any) => {
    if (a[sortBy] < b[sortBy]) return sortDir === "asc" ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  // Simulate server latency so caching is obvious
  await new Promise(r => setTimeout(r, 400));

  return NextResponse.json({
    rows: sorted.slice(start, end),
    total: ALL.length,
  });
}