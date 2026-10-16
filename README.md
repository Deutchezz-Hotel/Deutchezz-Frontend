# Deutchezz Hotel Frontend

React + TypeScript + Vite frontend for the Deutchezz Hotel guest site,
reception console, and admin console. The frontend uses the real ASP.NET Core
backend API only. If the backend does not implement a capability, the UI shows
an explicit unavailable or error state instead of inventing data.

## Tech stack

- Vite 5
- React 18 and TypeScript 5
- React Router 7
- Tailwind CSS 3 and Radix UI
- TanStack Query 5
- React Hook Form and Zod
- Vitest

## Setup for a clean clone

Use Windows PowerShell.

### Prerequisites

- Node.js 20 LTS. Vite 5.4.8 requires Node `^18.0.0 || >=20.0.0`; this
  repository pins the recommended LTS major in `.nvmrc` and `package.json`.
- Git.
- The backend repository and its prerequisites. Follow the backend README to
  start PostgreSQL and the API.

### 1. Clone the repository

```powershell
git clone <frontend-repository-url>
Set-Location .\Deutchezz-Fronted
```

Replace `<frontend-repository-url>` with the frontend repository URL supplied
for your project defense.

### 2. Install dependencies

```powershell
npm install
```

### 3. Create the local environment file

```powershell
Copy-Item .\.env.example .\.env
```

Edit `.env` and set the API URL:

```text
VITE_API_URL=http://localhost:5144/api/v1
```

This guide uses the backend HTTP launch profile. The backend
`src\Properties\launchSettings.json` also defines HTTPS at
`https://localhost:7041`; if you use that profile, set:

```text
VITE_API_URL=https://localhost:7041/api/v1
```

The backend must be running, and its `Cors:AllowedOrigins` must include the
frontend origin. The Vite development server defaults to
`http://localhost:5173`, which is already one of the backend's configured
development origins.

### 4. Start the frontend

```powershell
npm run dev
```

Open `http://localhost:5173`.

The backend must be started separately. Its Development startup applies EF
migrations and seeds the development roles, admin, receptionist, customer,
room inventory, and sample bookings. The demo login emails and password
configuration are documented in the backend repository's README.

## Environment

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend base URL including `/api/v1`, such as `http://localhost:5144/api/v1`. | Yes |

`VITE_API_URL` is validated at startup by `src\config\env.ts` and must be an
absolute URL.

## Backend integration

All API access goes through the real service registry in `src\api\index.ts`.
The backend launch-profile URLs are:

- HTTP: `http://localhost:5144`
- HTTPS: `https://localhost:7041`

The frontend value includes the backend API prefix:

```text
VITE_API_URL=http://localhost:5144/api/v1
```

The backend CORS policy must include the exact browser origin, including scheme
and port. Add another frontend origin to the backend
`Cors:AllowedOrigins` array and restart the API.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server on port 5173 by default. |
| `npm run build` | Type-check with `tsc -b` and build for production. |
| `npm run preview` | Preview the production build. |
| `npm run typecheck` | Run the application TypeScript check. |
| `npm run lint` | Run ESLint. |
| `npm run check:no-mocks` | Check for prohibited mock data and storage keys. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run types:api` | Generate API types from the backend OpenAPI document. |

`npm run types:api` currently uses the backend Development OpenAPI URL
`http://localhost:5144/openapi/v1.json`, matching the backend HTTP launch
profile. Start the backend before running it.

## Project structure

```text
src/
  api/          HTTP client, auth storage, errors, and real service registry
    services/   real backend adapter
  app/          router, providers, guards, and shells
  components/   shared UI components
  config/       static app configuration and validated environment
  features/     feature-specific modules
  hooks/        TanStack Query hooks
  layouts/      public and console layouts
  lib/          dates, money, labels, and identifiers
  pages/        public, customer, reception, and admin screens
  types/        backend DTOs and enums
scripts/
  check-no-mocks.mjs
docs/
  backend-contract-status.md
  mock-removal-inventory.md
```

`docs\mock-removal-inventory.md` is a historical record of the completed
mock-removal work, not a runtime configuration guide.

## Authentication

The access token is kept in memory. The refresh token is stored in
`localStorage` under `deutchezz.refresh`. The HTTP client performs one
in-flight refresh through `POST /auth/refresh` and retries a request once after
a 401 response.

## Testing

```powershell
npm run typecheck
npm run lint
npm test
```

Pure frontend tests cover domain rules such as date/night calculations and
money formatting. Integration behavior requires the backend to be running.
