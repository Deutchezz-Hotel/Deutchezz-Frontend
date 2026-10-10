# Deutchezz Hotel Ispahan — Frontend

React + TypeScript + Vite front-end for the Deutchezz Hotel Ispahan website and
its three portals (guest site, reception console, admin console). Rooms only —
no loyalty, housekeeping, or folio/invoice features by design.

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

| Variable        | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`  | Backend base URL, e.g. `http://localhost:5144/api/v1`              |
| `VITE_USE_MOCKS`| `true` runs the in-memory/localStorage mock adapter (no backend)   |

With `VITE_USE_MOCKS=true` the app talks to a mock backend that mirrors the real
REST contract (`src/api/services/mock`), persisting to `localStorage` under
`deutchezz.mockdb.v1`.

### Demo accounts (mock mode)

| Role          | Email                | Password   |
| ------------- | -------------------- | ---------- |
| Administrator | `admin@demo.com`     | `demo1234` |
| Receptionist  | `reception@demo.com` | `demo1234` |
| Customer      | `grace@example.com`  | `demo1234` |

The sign-in page also offers a role quick-login helper in development.

## Scripts

| Command            | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Start the dev server                        |
| `npm run build`    | Type-check (`tsc -b`) and build for prod    |
| `npm run preview`  | Preview the production build                |
| `npm run typecheck`| Type-check only (`tsc --noEmit`)            |
| `npm run lint`     | ESLint                                      |
| `npm test`         | Run the Vitest suite once                   |
| `npm run test:watch` | Run Vitest in watch mode                  |
| `npm run types:api`| Generate types from the backend OpenAPI doc |

## Project structure

```
src/
  api/          fetch client, RFC 7807 errors, auth storage, service factory
    services/   real/ + mock/ adapters behind a shared interface
  app/          router, route table, guards, providers, shells, auth context
  components/   shared app components + ui/ (shadcn primitives)
  features/     feature-scoped modules (e.g. booking draft/total logic)
  hooks/        TanStack Query hooks (queries + mutations)
  layouts/      public + console layouts
  lib/          dates, money/label formatting, id helpers
  pages/        route screens (public, customer, reception, admin)
  types/        DTOs and enums mirroring the backend contract
```

### Backend integration

All API access goes through the service seam in `src/api/index.ts`, which swaps
between the `real` (HTTP) and `mock` adapters based on `VITE_USE_MOCKS`. The
DTOs in `src/types/dto.ts` mirror the backend contract; regenerate them with
`npm run types:api` once the backend publishes
`http://localhost:5144/openapi/v1.json`.

## Testing

Vitest covers the pure domain rules (date/night math, money formatting,
availability overlap, and booking idempotency):

```bash
npm test
```

## Notes

- Money is NGN, rendered with the `en-NG` locale.
- Enum values are never shown raw in the UI — friendly labels live in
  `src/lib/format.ts`.
- Destructive operations use status toggles rather than DELETE.
