# Frontend ↔ Backend integration

This document records how the frontend connects to the real Deutchezz backend
(Phase A), the accounts you can sign in with, and the known gaps where the
backend contract is narrower than the UI.

## Running against the backend

1. Start the API (`dotnet run` in `Deutchezz_Hotel`) so it serves
   `http://localhost:5144/api/v1`.
2. In this repo set `.env`:

   ```
   VITE_API_URL=http://localhost:5144/api/v1
   VITE_USE_MOCKS=false
   ```

3. `npm run dev`.

`VITE_USE_MOCKS=true` keeps the app on the in-memory/localStorage mock adapter
(`src/api/services/mock`), which is still the only way to get the mock demo
accounts in `README.md`.

## Accounts

| Role | Email | Password | Notes |
| ---- | ----- | -------- | ----- |
| Administrator | `admin@deutchezz.local` | `Adm1n!Dev2026` | Seeded from user-secrets (`Seed:AdminEmail` / `Seed:AdminPassword`). Only the admin is seeded. |
| Receptionist | — | — | **Not seeded.** Sign in as admin → Staff → create a receptionist (email + password). Then sign out and sign in with it. |
| Customer | — | — | **Not seeded.** Use the public Register page, or admin → Guests/Reception to create one, then sign in. |

Identity password rules: at least 8 characters and at least one digit, no
special character required (e.g. `Recept1on`, `Customer1`).

> The `admin@deutchezz.test` / `Admin-Test-123!` pair belongs to the backend
> **integration tests** and does not exist in the dev database. Signing in with
> it returns **401**.

### 401 / 429 on the login page

- **401 Unauthorized** — the email/password is wrong (or the account does not
  exist yet). Use the credentials above.
- **429 Too Many Requests** — the `auth` rate-limit policy allows **10 requests
  per 60 seconds per client IP** and counts every login/register/refresh call,
  including failed ones. Repeated bad attempts trip it. Wait out the 60-second
  window, then retry with the correct credentials. The response body is RFC 7807
  `application/problem+json`.

## Known gaps (expected behavior, not bugs)

These are places where the backend intentionally returns less than the original
UI design, so the frontend hides or simplifies the affected data:

- **Payment list rows** — the backend `PaymentListItemResponse` was enriched (SoT v1.3) to
  include booking reference, client name and transaction reference, so the admin and reception
  payment tables now show Booking, Client, Amount, Transaction reference, Method and Recorded.
  Payer and recorded-by staff name are still not returned and display as blank/omitted.
- **Guest list extras** — total stays, in-house flag, current room numbers, and
  last-stay date are not returned; those columns were removed. The guest list
  shows Guest + Joined only.
- **Booking list extras** — guest email, room count, and a rooms summary are not
  returned by the list endpoint; those columns were removed. `nights` is
  computed client-side from check-in/check-out.
- **Dashboard** — `bookingsByStatus` and `roomTypePerformance` are empty; the
  revenue trend is derived from the reports endpoint (optional — the dashboard
  still renders if reports fail).
- **Reports** — bookings-by-status and bookings-by-payment-method breakdowns are
  not available; those sections show a fallback. `adr`, `revpar`, and
  `averageStayNights` are computed client-side.
- **Guest phone number** — the booking/detail endpoints do not return a guest
  phone. It is hidden rather than shown blank.
- **Hotel identity in Settings** — name/address/phone/email branding fields are
  not persisted by the settings API; they render read-only. Editable fields:
  check-in/out times, max rooms per booking, cancellation window (hours).
- **Max rooms per booking hint** — the booking form's quantity cap still uses
  the static `appConfig.maxRoomsPerBooking`; the backend enforces the real
  settings value regardless.
- **Room-type list performance** — the public room-type list and availability
  search issue one detail request per type (N+1) to recover images, features,
  and description. Correct, but not the most efficient.
- **Inactive room types have no detail endpoint** — `GET /room-types/{id}`
  (public and admin) only returns *active* types, but the admin list includes
  inactive ones. The frontend therefore does not request details for inactive
  types; those rows show name/bed/occupancy/price/status only (blank description
  and images). On save, empty optional fields are omitted so an inactive type's
  stored images/features are not wiped. Editing inactive details is impossible
  until it is reactivated.
- **Walk-in booking** — the create-booking page lives on the reception console
  (`/reception/bookings/new`) and is reused by the admin console at
  `/admin/bookings/new`. Both consoles' bookings pages and the reception
  dashboard link to it.

## Integrated in SoT v1.4 (backend `GET /admin|reception/rooms`, `POST /bookings/cancel`)

- **Date-based room board** — the admin and reception rooms pages show rooms for
  a selected date, and each row's `effectiveStatus` is the date-aware occupancy
  (Occupied for a date a live assignment covers, else Available; Maintenance and
  Inactive are always physical). Status tabs and search now hit the backend
  (`date`, `status`, `search` query params) instead of filtering 200 rows
  client-side, and the list is paginated (`page`, `pageSize`).
- **Assign-room candidates** — the reception booking detail's "Assign room"
  selector lists rooms that are Available on the booking's check-in date, and
  the backend now rejects physically double-booked rooms (409).
- **Anonymous cancellation** — the public confirmation page lets an unregistered
  guest cancel a Confirmed booking by reference + email via
  `POST /api/v1/bookings/cancel` (reason optional). The mock adapter supports the
  same flow.
- **Transactional emails** — the backend now sends booking confirmation,
  cancellation, payment-receipt and check-in/check-out HTML emails via SMTP.
  With no SMTP credentials configured (`Email:Smtp` in user secrets) messages
  only reach the API console log; nothing on the frontend changes.

## Integrated in SoT v1.5 (operational policies)

- **Cancellation window** — guest/anonymous cancellation is only accepted until
  `Cancellation:WindowHours` hours before the check-in day begins. Past that, the
  backend returns **409** `booking.cancellation_window_closed`; the confirmation
  page now surfaces the backend's message (`booking.cancellation_window_closed`
  also flows through the improved 409 `userMessage`).
- **Refunds** — a permitted cancellation refunds any amount already paid; the
  booking comes back with `paymentStatus: "Refunded"` and the cancellation email
  names the refunded amount.
- **Payment gates** — new admin settings `requireFullPaymentAtCheckIn` and
  `requirePaymentBeforeCheckOut` (default off) are editable on the admin Settings
  page as toggles. When enabled the backend returns **409** `booking.balance_outstanding`
  at check-in/check-out; the reception UI already shows those as an error banner.
- **Pending booking expiry** — background-only; nothing on the frontend.

## Translation layer

The adapter maps backend wire types to the existing view models, so the mock
adapter and `src/types/dto.ts` stay valid:

- `src/api/services/real/contracts.ts` — backend wire DTOs.
- `src/api/services/real/mappers.ts` — wire → view-model mapping.
- `src/api/services/real/index.ts` — endpoints, query-param names, auth flow.
