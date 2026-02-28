# Education Dashboard

Education statistics dashboard built with Next.js App Router, React Query, AG Grid, and Observable Plot, backed by the UK Department for Education Explore Education Statistics (EES) API.

This README describes how the current system works today.

## What the app does

The app lets users:
- load EES metadata (indicators, time periods, locations),
- choose indicator, time period, and location from dropdowns,
- view either:
  - a trend chart (latest time periods), or
  - a pageable/infinite table,
- query data through Next.js API proxy routes (so the browser does not call EES directly).

Current dataset in use:
- `18e39901-6f20-1676-bfb3-a581063b3a0a` (set in `lib/dataset.ts` and also hardcoded in `app/page.tsx` props).

## Tech stack

- Next.js `16.1.1` (App Router)
- React `19.2.3`
- TypeScript
- TanStack React Query
- AG Grid Community
- Observable Plot (+ d3)
- Tailwind CSS v4 (imported in global CSS)

## Runtime architecture

1. `app/layout.tsx` wraps the app in `QueryClientProvider` via `app/providers.tsx`.
2. `app/page.tsx` stores selected filter state:
   - indicator
   - time period
   - location
   - active tab (`charts` or `table`)
3. `components/EesControls.tsx` fetches metadata and populates dropdowns.
4. Based on selected tab:
   - `components/ChartsPanel.tsx` loads trend data and renders a line chart.
   - `components/SchoolTable.tsx` loads paged data into AG Grid infinite row model.
5. All EES calls go through Next.js API routes:
   - `GET /api/ees/meta`
   - `POST /api/ees/query`
6. API routes forward requests to `EES_API_BASE` from `.env.local`.

## End-to-end data flow

### A) Metadata load (controls)

- `EesControls` runs React Query `["eesMeta"]` using `fetchEesMeta()` from `lib/eesClient.ts`.
- Browser request:
  - `/api/ees/meta?dataSetId=<DATASET_ID>&types=Filters&types=Indicators&types=Locations&types=TimePeriods`
- Server route `app/api/ees/meta/route.ts`:
  - validates `dataSetId`,
  - forwards to `${EES_API_BASE}/data-sets/{dataSetId}/meta`,
  - returns upstream JSON/status.
- `EesControls` flattens grouped location structure into selectable options (`level`, `code`, `label`, etc.).

### B) Table load (AG Grid infinite)

- `SchoolTable` requires all three selections. If missing, it shows a prompt.
- AG Grid datasource `getRows`:
  - calculates `page` + `pageSize` from requested row block,
  - builds React Query key with dataset + filters + paging + sort,
  - fetches via `lib/fetchEesPage.ts`.
- `fetchEesPage` posts body:
  - `indicators: [indicatorId]`
  - `criteria.and` with selected `timePeriods.eq` and `locations.eq`
  - `page`, `pageSize`
  - optional `sorts`
- API route `app/api/ees/query/route.ts` proxies request to EES `/query`.
- Response mapping:
  - rows from `results` (or fallback `data`)
  - total from `paging.totalResults` (or fallback)
  - each grid row maps to `{ location, timePeriod, value, raw }`

### C) Chart load (trend)

- `ChartsPanel` fetches metadata (`["eesMeta"]`) and picks the latest 10 time periods (`slice(-10)`).
- It queries `fetchEesTrend` with:
  - selected indicator
  - selected location
  - multiple time periods (`timePeriods.in`)
- `fetchEesTrend` posts to `/api/ees/query` and extracts numeric values from `result.values`.
- `ChartsPanel` renders line + dots using Observable Plot.

Note:
- The `timePeriod` prop exists on `ChartsPanel` but is currently not used for filtering; chart uses latest 10 periods from metadata.

## Caching behavior

Global React Query defaults (`lib/queryClient.ts`):
- `staleTime`: 5 min
- `gcTime`: 30 min
- `refetchOnWindowFocus`: false
- `retry`: 1

Additional per-query behavior:
- metadata query uses `staleTime: 1 hour`
- table blocks and trend data use `staleTime: 5 min`

## API routes and server responsibilities

### `GET /api/ees/meta`
- File: `app/api/ees/meta/route.ts`
- Validates `dataSetId`
- Pass-through optional params:
  - `types` (multi-value)
  - `dataSetVersion`
- Forwards to EES meta endpoint

### `POST /api/ees/query`
- File: `app/api/ees/query/route.ts`
- Validates `dataSetId`
- Optional pass-through:
  - `dataSetVersion`
- Forwards request body to EES query endpoint with JSON headers

### `GET /api/schools` (mock endpoint)
- File: `app/api/schools/route.ts`
- Returns synthetic paged/sorted school data
- Not used by the current UI flow

## Project structure (current)

```text
app/
  api/
    ees/
      meta/route.ts
      query/route.ts
    schools/route.ts
  globals.css
  layout.tsx
  page.tsx
  providers.tsx
components/
  ChartsPanel.tsx
  EesControls.tsx
  SchoolTable.tsx
  Tabs.tsx
lib/
  agGridModules.ts
  dataset.ts
  ees.ts
  eesClient.ts
  fetchEesPage.ts
  fetchEesTrend.ts
  queryClient.ts
```

## Environment variables

Create `.env.local`:

```env
EES_API_BASE=https://api.education.gov.uk/statistics/v1
```

`lib/ees.ts` will throw if `EES_API_BASE` is missing.

## Local development

Install and run:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Available scripts:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Current implementation notes

- `lib/eesClient.ts` includes a `fetchEesPage` helper that is currently unused by table/chart paths.
- Dataset id is defined in two places (`lib/dataset.ts` and props in `app/page.tsx`); they currently match.
- Value parsing in table and trend paths includes fallbacks for inconsistent EES `values` shapes.
