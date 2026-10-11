# Deutchezz Hotel Ispahan — Frontend

React + TypeScript + Vite front-end for the Deutchezz Hotel Ispahan website and
its three portals (guest site, reception console, admin console). Rooms only —
no loyalty, housekeeping, or folio/invoice features by design.

The frontend talks **only** to the real ASP.NET Core backend API. There is no
mock adapter and no Supabase integration; if the backend does not implement a
capability, the UI shows an explicit unavailable/error state rather than
inventing data.

## Tech stack

- **Build:** Vite 5, TypeScript 5 (strict)
- **UI:** React 18, react-router-dom v7, Tailwind CSS 3, shadcn/ui (Radix)
- **Server state:** TanStack Query v5
- **Forms:** react-hook-form + zod
- **Charts:** recharts
- **Tests:** Vitest

## Getting started

```bash
npm install
cp .env.example .env      # already present in this repo
npm run dev
```

### Environment

| Variable       | Description                                           |
| -------------- | ----------------------------------------------------- |
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5144/api/v1` |

`VITE_API_URL` is validated at startup (`src/config/env.ts`); the app throws if
it is missing or not a valid URL.

### Backend integration

All API access goes through the service seam in `src/api/index.ts`. The DTOs in
`src/types/dto.ts` mirror the backend contract; regenerate them with
`npm run types:api` once the backend publishes
`http://localhost:5144/openapi/v1.json`.

See `docs/backend-contract-status.md` for the endpoint-by-endpoint status.

## Scripts

| Command              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the dev server                         |
| `npm run build`      | Type-check (`tsc -b`) and build for prod     |
| `npm run preview`    | Preview the production build                 |
| `npm run typecheck`  | Type-check only (`tsc --noEmit`)             |
| `npm run lint`       | ESLint                                       |
| `npm run check:no-mocks` | Fail if mock data or unexpected storage keys are present |
| `npm test`           | Run the Vitest suite once                    |
| `npm run test:watch` | Run Vitest in watch mode                     |
| `npm run types:api`  | Generate types from the backend OpenAPI doc  |

## Project structure

```
src/
  api/          fetch client, RFC 7807 errors, auth storage, service factory
    services/   real/ adapter behind the shared interface
  app/          router, route table, guards, providers, shells, auth context
  components/   shared app components + ui/ (shadcn primitives)
  config/       static app config + validated env
  features/     feature-scoped modules (e.g. booking draft/total logic)
  hooks/        TanStack Query hooks (queries + mutations)
  layouts/      public + console layouts
  lib/          dates, money/label formatting, id helpers
  pages/        route screens (public, customer, reception, admin)
  types/        DTOs and enums mirroring the backend contract
scripts/
  check-no-mocks.mjs   guard against mock/demo data and stray storage keys
docs/
  backend-contract-status.md   endpoint status (LIVE / NOT BUILT YET)
  mock-removal-inventory.md    what was removed and why
```

## Auth model

The access token lives in memory; the refresh token is persisted to
`localStorage` under `deutchezz.refresh`. `src/api/http.ts` performs a single
in-flight refresh via `POST /auth/refresh` and retries a request once on 401.

## Testing

Vitest covers the pure domain rules (date/night math and money formatting):

```bash
npm test
```

## Notes

- Money is NGN, rendered with the `en-NG` locale.
- Enum values are never shown raw in the UI — friendly labels live in
  `src/lib/format.ts`.
- Destructive operations use status toggles rather than DELETE.
