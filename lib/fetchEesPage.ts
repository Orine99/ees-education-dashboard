export type PageResult<T> = { rows: T[]; total: number };
type Sort = { colId: string; sort: "asc" | "desc" } | null;

export async function fetchEesPage(params: {
  dataSetId: string;
  page: number;
  pageSize: number;
  sort?: Sort;

  indicatorId: string;

  location: { level: string; code: string; label?: string; oldCode?: string };
  timePeriod: { code: string; period: string; label?: string };
}): Promise<PageResult<any>> {
  const body: any = {
    indicators: [params.indicatorId],
    page: params.page,
    pageSize: params.pageSize,

    criteria: {
      and: [
        {
          timePeriods: {
            eq: {
              code: params.timePeriod.code,
              period: params.timePeriod.period,
            },
          },
        },
        {
          locations: {
            eq: {
              level: params.location.level,
              code: params.location.code,
            },
          },
        },
      ],
    },

    debug: true,
  };

  if (params.sort?.colId && params.sort.sort) {
    body.sorts = [
      {
        field: params.sort.colId,
        direction: params.sort.sort === "asc" ? "Asc" : "Desc",
      },
    ];
  }

  const res = await fetch(`/api/ees/query?dataSetId=${params.dataSetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`EES query failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  const results = data.results ?? data.data ?? [];
  const total = data.paging?.totalResults ?? data.total ?? results.length;

  console.log("EES query response sample:", {
  keys: Object.keys(data ?? {}),
  firstResult: (data.results ?? data.data ?? [])[0],
    });

  return { rows: results, total };

 



}

