# Backend Contract Status

Maps every endpoint the frontend may call to the ASP.NET Core backend and its
status. Derived from the controller route attributes under
`Deutchezz_Hotel/src/Api/Controllers` (the backend's OpenAPI document at
`/openapi/v1.json` was not reachable while this was written — start the API and
run `npm run types:api` to refresh generated types).

Base URL: `VITE_API_URL` (default `http://localhost:5144/api/v1`).

Legend: **LIVE** = route exists and is implemented; **NOT BUILT YET** = no route;
**UNVERIFIED** = route assumed but not confirmed against the running backend.

## Public

| Endpoint | Status | Notes |
| --- | --- | --- |
| `POST /auth/register` | LIVE | |
| `POST /auth/login` | LIVE | |
| `POST /auth/refresh` | LIVE | Called by `http.ts` on 401. |
| `GET /room-types` | LIVE | |
| `GET /room-types/{id}` | LIVE | Active types only. |
| `POST /availability/search` | LIVE | |
| `POST /bookings` | LIVE | Requires `Idempotency-Key` (GUID). |
| `POST /bookings/lookup` | LIVE | |

## Authenticated

| Endpoint | Status | Notes |
| --- | --- | --- |
| `POST /auth/logout` | LIVE | `[Authorize]`. |
| `GET /auth/me` | LIVE | `[Authorize]`. |

## Customer (`Policy = CustomerOnly`)

| Endpoint | Status | Notes |
| --- | --- | --- |
| `GET /me/bookings` | LIVE | |
| `GET /me/bookings/{id}` | LIVE | |
| `POST /me/bookings/{id}/cancel` | LIVE | |
| `GET /me/profile` | LIVE | |
| `PUT /me/profile` | LIVE | |
| `GET /me/notifications` | LIVE | Backend-only; no customer UI yet. |
| `GET /me/notifications/unread-count` | LIVE | Backend-only. |
| `POST /me/notifications/{id}/read` | LIVE | Backend-only. |

## Reception (`Policy = StaffOnly`)

| Endpoint | Status | Notes |
| --- | --- | --- |
| `GET /reception/bookings` | LIVE | |
| `GET /reception/bookings/{id}` | LIVE | |
| `POST /reception/bookings` | LIVE | Requires `Idempotency-Key`. |
| `POST /reception/bookings/{id}/assign-rooms` | LIVE | |
| `POST /reception/bookings/{id}/check-in` | LIVE | |
| `POST /reception/bookings/{id}/check-out` | LIVE | |
| `GET /reception/rooms` | LIVE | |
| `GET /reception/guests` | LIVE | |
| `GET /reception/payments` | LIVE | |
| `POST /reception/payments` | LIVE | |

## Admin (`Policy = AdminOnly`)

| Endpoint | Status | Notes |
| --- | --- | --- |
| `GET /admin/dashboard` | LIVE | |
| `GET /admin/reports` | LIVE | |
| `GET /admin/rooms` | LIVE | |
| `GET /admin/rooms/{id}` | LIVE | |
| `POST /admin/rooms` | LIVE | |
| `PUT /admin/rooms/{id}` | LIVE | |
| `PATCH /admin/rooms/{id}/status` | LIVE | |
| `GET /admin/room-types` | LIVE | |
| `GET /admin/room-types/{id}` | LIVE | |
| `POST /admin/room-types` | LIVE | |
| `PUT /admin/room-types/{id}` | LIVE | |
| `PATCH /admin/room-types/{id}/status` | LIVE | |
| `GET /admin/bookings` | LIVE | |
| `GET /admin/guests` | LIVE | |
| `GET /admin/staff` | LIVE | |
| `GET /admin/staff/{id}` | LIVE | |
| `POST /admin/staff` | LIVE | |
| `PUT /admin/staff/{id}` | LIVE | |
| `PATCH /admin/staff/{id}/status` | LIVE | |
| `GET /admin/payments` | LIVE | |
| `GET /admin/notifications` | LIVE | |
| `GET /admin/activity-logs` | LIVE | |
| `GET /admin/settings` | LIVE | |
| `PUT /admin/settings` | LIVE | |

## Uploads

| Endpoint | Status | Notes |
| --- | --- | --- |
| `POST /uploads/images` | LIVE | Admin-only, multipart `file`, ≤10 MB, returns `{ url, publicId }`. **Intentionally NOT used by the frontend** in this phase: room-type images are edited as an "Image URLs" list. The endpoint remains available should the uploader return. |

## Deviations from the task's endpoint allow-list

These are real, verified endpoints used by the UI that were not in the task's
allow-list. They are kept rather than removed to avoid regressions.

| Endpoint | Where | Why kept |
| --- | --- | --- |
| `POST /bookings/cancel` | `confirmation.tsx` (guest, no account) | Anonymous cancel is a core guest flow and the route exists. |
| `GET /me/notifications*` | (backend-only) | Implemented and harmless; no UI calls it yet. |

## Not built yet

None of the endpoints the frontend currently calls are missing. If a future UI
targets an endpoint without a route, render `UnavailableState`
(`src/components/feedback.tsx`) instead of fabricating data.
