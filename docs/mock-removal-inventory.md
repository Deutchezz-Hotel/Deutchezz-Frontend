# Mock Removal Inventory

Scope: every source of non-real (mock/fake/demo) data in the frontend and the
action taken to remove it. Generated during the `chore/remove-mocks-and-supabase`
work. Classification legend:

- **REMOVE** — deleted outright; nothing replaces it.
- **REPLACE-WITH-API** — the UI keeps working but is driven by the real backend.
- **KEEP** — legitimately static (branding/copy/theme) or a real runtime concern.

Supabase is already absent from the tree (removed earlier in `58d59b8`): no
`supabase` / `@supabase` references, no `@supabase/supabase-js` dependency, no
`supabase/` directory, no `VITE_SUPABASE_*` env vars. This phase is therefore a
no-op except for the env example cleanup noted below.

## Mock adapter layer — REMOVE

The entire in-memory + localStorage adapter is deleted. After this change the UI
talks only to the fetch adapter (`src/api/services/real`).

| Path | Notes |
| --- | --- |
| `src/api/services/mock/index.ts` | Mock `ServiceCollection` export. |
| `src/api/services/mock/db.ts` | Seed DB: demo users (`Grace Ibrahim`, `David Musa`, `Esther Samuel`, `Peter James`, `Tunde Bakare`), booking references `DHI-2026-*`, `Reward nights`, seeded rooms/bookings/payments. |
| `src/api/services/mock/admin.ts` | Admin adapter + `newId(...)` client ids + `uploadImage`. |
| `src/api/services/mock/auth.ts` | Fake opaque tokens + `/auth/me`. |
| `src/api/services/mock/availability.ts` | Seeded availability. |
| `src/api/services/mock/bookings.ts` | Seeded bookings. |
| `src/api/services/mock/me.ts` | Seeded me endpoints. |
| `src/api/services/mock/reception.ts` | Seeded reception endpoints. |
| `src/api/services/mock/roomTypes.ts` | Seeded room types. |
| `src/api/services/mock/selectors.ts` | DB selectors. |
| `src/api/services/mock/session.ts` | Mock session via `authStorage.getSessionUserId()`. |
| `src/api/services/mock/latency.ts` | Simulated network latency. |
| `src/api/services/mock/rules.ts` | Client-side rule mirror. |
| `src/api/services/mock/rules.test.ts` | Tests for the above. |

## Service seam — REPLACE-WITH-API

| Location | Change | Reason |
| --- | --- | --- |
| `src/api/index.ts` | Drop `mockServices` import, `useMocks` flag and the `VITE_USE_MOCKS` switch; `services = realServices`. | No adapter toggle remains. |
| `src/api/services/interfaces.ts` | Remove `AdminApi.uploadImage` and the `UploadedImage` import. | Uploads are out of scope for this phase (see Image URLs below). |
| `src/api/services/real/index.ts` | Remove `realAdminApi.uploadImage`. | Same. |
| `src/types/dto.ts` | Remove the now-unused `UploadedImage` interface. | Dead type. |
| `src/types/index.ts` | (barrel) — no change; picks up the removed type automatically. | |

## Auth / session — REMOVE mock bits

| Location | Change | Reason |
| --- | --- | --- |
| `src/api/auth-storage.ts` | Remove `ACCESS_KEY` (`deutchezz.access`), `setSession()`, `getSessionUserId()`. Keep in-memory access token + `REFRESH_KEY` (`deutchezz.refresh`). | The `mock.<userId>` session marker only existed for the mock adapter. `deutchezz.refresh` is the real auth token key allowed by `check:no-mocks`. |
| `src/app/auth.tsx` | Drop `authStorage.getSessionUserId()` from the `hasSession` check. | Depends on a deleted method. |

## Client-side fake-id helpers — REMOVE

| Location | Change | Reason |
| --- | --- | --- |
| `src/lib/id.ts` | Remove `hashPayload()` and `newId()` (only used by the mock adapter). Rewrite `newIdempotencyKey()` to avoid `Math.random` (use `crypto.getRandomValues` fallback). | `Math.random(` is banned; the two helpers become dead code. |

## Demo login — REMOVE

| Location | Change | Reason |
| --- | --- | --- |
| `src/components/dev-quick-login.tsx` | Delete. | Hard-coded demo accounts + `useMocks`. |
| `src/pages/login.tsx` | Remove the import and `<DevQuickLogin />` render. | Sole consumer. |

## Env / docs — REPLACE-WITH-API

| Location | Change | Reason |
| --- | --- | --- |
| `.env.example` | Remove `VITE_USE_MOCKS`. | No mock adapter. |
| `.env` | Remove `VITE_USE_MOCKS` (keep `VITE_API_URL`). | Same. |
| `src/config/env.ts` | **New.** zod-validated env; `VITE_API_URL` required, throws at startup. Consumed by `src/api/http.ts`. | Fail fast instead of silently defaulting. |
| `README.md` | Rewrite: remove mock-mode instructions and the demo-account table; document real API setup. | |
| `.gitignore` | Repair corrupted encoding (mixed UTF-8 / UTF-16LE NULs). | File was unreadable to tooling. |

## Booking flow cross-page persistence — REMOVE

`sessionStorage` keys other than the auth token and theme are banned. The
confirmation flow used a `deutchezz.confirmation.<reference>` key as a reload
workaround.

| Location | Change | Reason |
| --- | --- | --- |
| `src/pages/review.tsx` | Remove the `sessionStorage.setItem` on booking success; navigate with router state only. | Banned key. |
| `src/pages/lookup.tsx` | Remove the `sessionStorage.setItem`; navigate with router state only. Change the reference placeholder away from `DHI-2026-XXXXXX`. | Banned key + banned literal. |
| `src/pages/confirmation.tsx` | Remove the `sessionStorage` fallback in `resolved`; use `location.state` only and redirect to `/my-booking` (with the reference pre-filled) when absent. | Banned key. Reload → re-lookup is acceptable and safe. |

## Image URLs editor — REPLACE-WITH-API

Per the task, the drag-and-drop uploader is replaced by a plain "Image URLs"
list editor; room types continue to be created/updated through the real API.

| Location | Change | Reason |
| --- | --- | --- |
| `src/components/image-uploader.tsx` | Delete. | Depended on `services.admin.uploadImage`. |
| `src/components/image-url-list.tsx` | **New.** Add URL (http/https validated), thumbnail preview, remove, max 8. Writes the `imageUrls` array. | |
| `src/pages/admin/room-types.tsx` | Swap `<ImageUploader>` for `<ImageUrlList>` under a "Image URLs" label. | |

> **Note:** the backend *does* expose `POST /uploads/images` (admin-only,
> multipart `file`, ≤10 MB, returns `{ url, publicId }`). The task explicitly
> directs us to the URL-list approach, so the upload endpoint is intentionally
> left unused for now and `uploadImage` is removed from the service interface.

## Availability errors — ADD

| Location | Change | Reason |
| --- | --- | --- |
| `src/components/feedback.tsx` | Add `ErrorState` (and `UnavailableState`) shared components. | Pages can render explicit unavailable/error states instead of empty data. |

## KEEP (verified real / static, not mock)

| Location | Why it stays |
| --- | --- |
| `src/config/appConfig.ts` | Static branding + operational defaults (hotel name, address, `maxRoomsPerBooking`, currency). Not mock data. Rendered copy only. |
| `index.html` `theme` localStorage | Legitimate theme preference; explicitly allowed by `check:no-mocks`. |
| `src/api/auth-storage.ts` `deutchezz.refresh` | Real refresh-token storage; explicitly allowed. |
| `src/components/hero-showcase.tsx`, `use-toast`, `date-picker` `setTimeout` | Real carousel/debounce/toast timers, not mocks. |
| `src/features/booking/types.ts` `estimateTotal` | Client-side *estimate* of the stay; clearly labelled and superseded by the server total. Not mock data. |
| `src/api/services/real/mappers.ts` | Derives missing display fields (e.g. empty arrays) from real responses; never fabricates records. |
| `POST /bookings/cancel` anonymous cancel (`confirmation.tsx`) | Not in the task allow-list but verified present on the backend. Kept; documented as a deviation in the final report. |
