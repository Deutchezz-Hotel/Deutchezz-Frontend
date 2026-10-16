# Frontend to backend integration

This document describes the real Deutchezz backend integration, development
accounts, and known places where the backend contract is narrower than the UI.
The frontend runtime uses the real backend only.

## Running against the backend

1. Start the backend from its repository:

   ```powershell
   dotnet run --project .\src --launch-profile http
   ```

   The HTTP launch profile serves the API at `http://localhost:5144`.

2. In this repository, copy `.env.example` to `.env` and set:

   ```text
   VITE_API_URL=http://localhost:5144/api/v1
   ```

3. Start the frontend:

   ```powershell
   npm run dev
   ```

The backend must be running, and its `Cors:AllowedOrigins` configuration must
include the frontend origin, normally `http://localhost:5173`.

## Accounts

| Role | Email | Password location | Notes |
| ---- | ----- | ----------------- | ----- |
| Administrator | `admin@example.com` | Backend `Seed:AdminPassword` | Development-only seeded account. |
| Receptionist | `receptionist@deutchezz.local` | Backend `Seed:ReceptionistPassword` | Development-only seeded account. |
| Customer | `customer@deutchezz.local` | Backend `Seed:CustomerPassword` | Development-only seeded account. |

The password values are configured in the backend's ignored
`src\appsettings.Development.json`. See the backend README for the complete
setup sequence. Do not print or commit password values.

### 401 / 429 on the login page

- **401 Unauthorized** means the email/password is wrong or the account does
  not exist in the current development database.
- **429 Too Many Requests** means the backend authentication rate limit was
  reached. The configured limit is 10 requests per 60 seconds per client IP,
  including failed login, registration, and refresh calls. Wait for the window
  to expire before trying again.

## Known gaps

These are expected contract differences; the frontend displays the available
data or an explicit unavailable/error state.

- **Payment list rows**: booking reference, client name, transaction reference,
  method, amount, and recorded time are available. Payer and recording-staff
  names are not returned.
- **Guest list extras**: total stays, in-house state, current room numbers, and
  last-stay date are not returned. The UI shows the supported guest fields.
- **Booking list extras**: guest email, room count, and room summary are not
  returned. Nights are computed client-side from the dates.
- **Dashboard**: `bookingsByStatus` and `roomTypePerformance` are empty; the
  revenue trend comes from the reports endpoint when available.
- **Reports**: bookings-by-status and bookings-by-payment-method breakdowns are
  unavailable. `adr`, `revpar`, and `averageStayNights` are computed client-side.
- **Guest phone number**: booking/detail responses do not return it, so the UI
  does not display it.
- **Hotel identity settings**: name, address, phone, email, and branding are
  read-only because they are not persisted by the settings API. Operational
  settings remain editable.
- **Maximum rooms hint**: the booking form uses the static frontend default,
  while the backend remains authoritative.
- **Room-type list performance**: public room-type and availability screens
  issue detail requests per type to recover images, features, and description.
- **Inactive room types**: the backend does not expose inactive room-type
  details, so the UI omits unavailable detail fields until reactivation.
- **Walk-in booking**: the create-booking page is in the reception console and
  is reused by the admin console.

## Integrated backend capabilities

- Date-aware room boards and paginated room searches are backed by the API.
- Room assignment candidates are filtered by booking-date availability.
- Anonymous cancellation is supported through
  `POST /api/v1/bookings/cancel`.
- Transactional email notifications are sent by the backend when SMTP is
  configured; otherwise the backend logging fallback records that messages
  were not sent.
- Cancellation windows, refunds, payment gates, and pending-booking expiry
  follow backend policy and error responses.

## Translation layer

The real API adapter maps backend wire DTOs to the frontend view models:

- `src/api/services/real/contracts.ts` contains backend wire DTOs.
- `src/api/services/real/mappers.ts` maps wire DTOs to view models.
- `src/api/services/real/index.ts` contains endpoints, query parameters, and
  authentication flow.
