/**
 * API DTOs.
 *
 * These mirror the backend contract and live in one place so they can be
 * swapped for generated types (openapi-typescript); see the root README for
 * the backend OpenAPI URL and generation command. Do not scatter DTO shapes elsewhere.
 *
 * Conventions:
 *  - JSON camelCase.
 *  - Dates are "yyyy-MM-dd" strings.
 *  - Money is a decimal number in NGN (no taxes or fees exist yet).
 */
import type {
  BookingSource,
  BookingStatus,
  EarlyCheckOutReason,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
  StaffCancellationReason,
  StaffRole,
  UserRole,
} from './enums';

/** Standard paginated list envelope. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/* ------------------------------- Auth / user ----------------------------- */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  initials: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

/** Public contact-form submission (POST /contact). */
export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

/**
 * Neutral acknowledgment for register/resend/forgot. The backend never reveals
 * whether an email/phone already exists, so these always succeed (202).
 */
export interface RegisterPendingResponse {
  message: string;
  /** Seconds before another code may be requested for this email. */
  resendAvailableInSeconds: number;
}

/* -------------------------------- Uploads -------------------------------- */

export interface UploadedImage {
  url: string;
  publicId: string;
}

/* -------------------------------- Room types ----------------------------- */

export interface RoomTypeResponse {
  id: string;
  name: string;
  description: string;
  /** Per-night rate in NGN. */
  basePrice: number;
  maximumOccupancy: number;
  bedType: string;
  imageUrls: string[];
  features: string[];
  isActive: boolean;
}

export interface SaveRoomTypeRequest {
  name: string;
  description: string;
  basePrice: number;
  maximumOccupancy: number;
  bedType: string;
  imageUrls: string[];
  features: string[];
}

/* ------------------------------- Availability ---------------------------- */

export interface AvailabilitySearchRequest {
  checkInDate: string;
  /** "HH:mm" Lagos-local check-in time; omitted means the stay policy default. */
  checkInTime?: string | null;
  checkOutDate: string;
  /** "HH:mm" Lagos-local check-out time; omitted means the policy default. */
  checkOutTime?: string | null;
  adults: number;
  children: number;
  rooms: number;
}

export interface AvailableRoomTypeResponse {
  roomTypeId: string;
  name: string;
  description: string;
  bedType: string;
  maximumOccupancy: number;
  imageUrls: string[];
  features: string[];
  pricePerNight: number;
  availableRooms: number;
  /** pricePerNight * nights for the requested stay. */
  subtotalPerRoom: number;
}

export interface AvailabilityResponse {
  checkInDate: string;
  /** "HH:mm" Lagos-local check-in time echoed by the backend. */
  checkInTime: string;
  checkOutDate: string;
  /** "HH:mm" Lagos-local check-out time echoed by the backend. */
  checkOutTime: string;
  /** ISO-8601 instant with the Lagos offset (e.g. 2026-10-13T14:00:00+01:00). */
  checkInAt: string;
  /** ISO-8601 instant with the Lagos offset. */
  checkOutAt: string;
  nights: number;
  totalAvailableRooms: number;
  roomTypes: AvailableRoomTypeResponse[];
}

/* ------------------------------ Stay policy ------------------------------ */

/**
 * Public, cacheable stay policy (SoT v1.12). Tells the booking forms which
 * check-in/check-out times are accepted and how long a stay may be stretched.
 * Times are "HH:mm" in Africa/Lagos.
 */
export interface StayPolicy {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  /** Times must align to this many minutes. */
  timeSlotMinutes: number;
  earliestCheckInTime: string;
  latestCheckInTime: string;
  earliestCheckOutTime: string;
  latestCheckOutTime: string;
  /** Minutes a room must rest between stays. */
  turnaroundMinutes: number;
  /** Overstay hours up to this amount are free (no extended-stay surcharge). */
  graceHours: number;
  /** Hard cap on how many nights a single stay may be booked for. */
  maxStayNights: number;
}

/* ------------------------------ Pricing (v1.14) -------------------------- */

/** One requested room line for a prospective price quote. */
export interface PricingQuoteRoom {
  roomTypeId: string;
  quantity: number;
}

/** A prospective stay to price; the backend owns the duration-based formula. */
export interface PricingQuoteRequest {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  /** "walkIn"/"reception" relaxes the not-in-the-past check; omit for online. */
  bookingType?: 'online' | 'walkIn' | 'reception';
  rooms: PricingQuoteRoom[];
}

/** A priced room line from `POST /pricing/quote`. */
export interface PricingQuoteLine {
  roomTypeId: string;
  roomTypeName: string;
  quantity: number;
  ratePerNight: number;
  nights: number;
  overageMinutes: number;
  tierLabel: string | null;
  subtotal: number;
  extraCharge: number;
  lineTotal: number;
}

/** Full quote: booked-nights base plus any tiered extended-stay overage. */
export interface PricingQuote {
  nights: number;
  overageMinutes: number;
  lines: PricingQuoteLine[];
  subtotal: number;
  extraChargeAmount: number;
  total: number;
}

/** One conflicted room in a 409 `room.occupied_until` response (v1.12). */
export interface RoomConflict {
  roomId: string;
  roomNumber: string;
  /** ISO-8601 instant the occupant vacates (with the Lagos offset). */
  occupiedUntil: string;
  occupantGuestName: string | null;
  occupantBookingReference: string | null;
  /** ISO-8601 instant the requested stay would start. */
  requestedCheckInAt: string;
}

/* -------------------------------- Bookings ------------------------------- */

export interface BookingGuest {
  firstName: string;
  lastName: string;
  /** Null for walk-in guests recorded at the front desk without an email. */
  email: string | null;
  phoneNumber: string;
}

export interface BookingRoomRequest {
  roomTypeId: string;
  quantity: number;
}

export interface CreateBookingRequest {
  checkInDate: string;
  /** "HH:mm" Lagos-local check-in time; omitted means the policy default. */
  checkInTime?: string | null;
  checkOutDate: string;
  /** "HH:mm" Lagos-local check-out time; omitted means the policy default. */
  checkOutTime?: string | null;
  adults: number;
  children: number;
  guest: BookingGuest;
  rooms: BookingRoomRequest[];
  specialRequests?: string | null;
  /**
   * Set to true to proceed past the "possible duplicate booking" guard. Only
   * sent after the guest has reviewed the warning and chosen to continue.
   */
  acknowledgeDuplicate?: boolean;
}

/**
 * Front-desk guest details. Walk-ins have no email and no special requests —
 * the booking summary is emailed to the staff member who created it.
 */
export interface ReceptionGuestRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/** Front-desk (walk-in) booking creation. No email, no special requests. */
export interface ReceptionCreateBookingRequest {
  checkInDate: string;
  /** "HH:mm" Lagos-local check-in time; omitted means the policy default. */
  checkInTime?: string | null;
  checkOutDate: string;
  /** "HH:mm" Lagos-local check-out time; omitted means the policy default. */
  checkOutTime?: string | null;
  adults: number;
  children: number;
  guest: ReceptionGuestRequest;
  rooms: BookingRoomRequest[];
}

/** Staff cancellation with an explicit reason and refund choice. */
export interface ReceptionCancelBookingRequest {
  reason: StaffCancellationReason;
  /** Required when reason is 'Other'. */
  notes?: string | null;
  /** True refunds any Paid amounts; false keeps them and records the choice. */
  refundPaidAmounts: boolean;
}

/** A live room assignment belonging to a booking line. */
export interface AssignedRoom {
  /** `RoomAssignment` id — used to reassign or unassign this specific room. */
  id: string;
  roomId: string;
  roomNumber: string;
}

export interface BookingRoomLine {
  bookingRoomTypeId: string;
  roomTypeId: string;
  roomTypeName: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  subtotal: number;
  /** Extended-stay surcharge for this line (0 when none applies). */
  extraCharge: number;
  /** Room numbers of the live assignments, in assignment order. */
  assignedRoomNumbers?: string[];
  /** Rich live assignments for this line (v1.9); enables per-room actions. */
  assignedRooms?: AssignedRoom[];
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  /** "HH:mm" Lagos-local scheduled check-in time. */
  checkInTime: string;
  checkOutDate: string;
  /** "HH:mm" Lagos-local scheduled check-out time. */
  checkOutTime: string;
  /** ISO-8601 instant with the Lagos offset (scheduled check-in). */
  checkInAt: string;
  /** ISO-8601 instant with the Lagos offset (scheduled check-out). */
  checkOutAt: string;
  /** ISO-8601 instant the guest actually checked in, or null. */
  actualCheckInAt: string | null;
  /** ISO-8601 instant the guest actually checked out, or null. */
  actualCheckOutAt: string | null;
  /** True when checked in but the scheduled check-out has passed. */
  isOverdueCheckOut: boolean;
  nights: number;
  adults: number;
  children: number;
  guest: BookingGuest;
  rooms: BookingRoomLine[];
  specialRequests: string | null;
  totalAmount: number;
  /** Total extended-stay surcharge across all lines (0 when none applies). */
  extraChargeAmount: number;
  createdAt: string;
  /** How the booking was created. */
  source: BookingSource;
  /** Staff member who created the booking at the desk; null for online bookings. */
  createdByName: string | null;
  /** "yyyy-MM-dd" — bumped on any lifecycle change (rooms assigned, checked in, payment recorded, cancelled). */
  updatedAt: string;
  /** Live payment summary from the backend booking detail. */
  payments?: { totalPaid: number; balance: number };
  /** ISO-8601 instant the booking was cancelled, or null. */
  cancelledAt?: string | null;
  /** When a cancelled, unpaid booking will be permanently purged, or null. */
  purgeScheduledAt?: string | null;
  /** True when at least one payment exists (a cancelled booking is held for refund review). */
  hasPayments?: boolean;
}

/** Row shape used by booking tables across the portals. */
export interface BookingListItem {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  /** "HH:mm" Lagos-local scheduled check-in time. */
  checkInTime: string;
  checkOutDate: string;
  /** "HH:mm" Lagos-local scheduled check-out time. */
  checkOutTime: string;
  /** ISO-8601 instant with the Lagos offset (scheduled check-in). */
  checkInAt: string;
  /** ISO-8601 instant with the Lagos offset (scheduled check-out). */
  checkOutAt: string;
  /** ISO-8601 instant the guest actually checked in, or null. */
  actualCheckInAt: string | null;
  /** ISO-8601 instant the guest actually checked out, or null. */
  actualCheckOutAt: string | null;
  /** True when checked in but the scheduled check-out has passed. */
  isOverdueCheckOut: boolean;
  nights: number;
  guestName: string;
  guestEmail: string | null;
  guestPhoneNumber: string;
  roomsCount: number;
  roomsSummary: string;
  totalAmount: number;
  /** Outstanding balance (total minus paid payments). Zero once fully paid. */
  balanceDue: number;
  source: BookingSource;
  /** Staff member who created the booking at the desk; null for online bookings. */
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingLookupRequest {
  bookingReference: string;
  email: string;
}

/** Row shape used by booking tables across the portals. */
export interface BookingListItem {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  guestEmail: string | null;
  guestPhoneNumber: string;
  roomsCount: number;
  roomsSummary: string;
  totalAmount: number;
  /** Outstanding balance (total minus paid payments). Zero once fully paid. */
  balanceDue: number;
  source: BookingSource;
  /** Staff member who created the booking at the desk; null for online bookings. */
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

/** Anonymous cancellation is authorised by reference + email, like lookup. */
export interface AnonymousCancelBookingRequest {
  bookingReference: string;
  email: string;
  reason?: string;
}

export interface AssignRoomsRequest {
  assignments: { bookingRoomTypeId: string; roomId: string }[];
  /** Retry flag: proceed when a room is not free right now but frees before the stay. */
  acknowledgeLateAvailability?: boolean;
}

/* ------------------------- Stay changes (v1.9) --------------------------- */

/**
 * Required only when checking out before the scheduled check-out moment.
 * `guestConsented` is an attested flag recorded for audit; `notes` is required
 * when the reason is 'Other'.
 */
export interface EarlyCheckOutInfo {
  reason: EarlyCheckOutReason;
  notes?: string | null;
  guestConsented: boolean;
}

/** Optional body for check-out; send `earlyCheckOut` for an early check-out. */
export interface CheckOutRequest {
  earlyCheckOut?: EarlyCheckOutInfo | null;
}

/** Moves part of a room line to a different room type before arrival. */
export interface ChangeRoomTypeRequest {
  bookingRoomTypeId: string;
  newRoomTypeId: string;
  quantity: number;
}

/** Result of a room-type change: the updated booking and any released room numbers. */
export interface ChangeRoomTypeResult {
  booking: BookingResponse;
  assignmentsCleared: string[];
}

/** Swaps one live room assignment for another room of the same type. */
export interface ReassignRoomRequest {
  roomAssignmentId: string;
  newRoomId: string;
  reason?: string | null;
  /** Retry flag: proceed when a room is not free right now but frees before the stay. */
  acknowledgeLateAvailability?: boolean;
}

/** Releases a live room assignment before check-in. */
export interface UnassignRoomRequest {
  roomAssignmentId: string;
}

/* --------------------------------- Rooms --------------------------------- */

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  roomTypeName: string;
  /** Persisted physical state (editable by admins). */
  status: RoomStatus;
  /** Occupancy for the requested board moment; falls back to `status` when absent. */
  effectiveStatus?: RoomStatus;
  /** ISO-8601 Lagos instant the current occupant's stay ends (board only; null when free). */
  occupiedUntil?: string | null;
  /** ISO-8601 Lagos instant the room frees up (occupied until + turnaround). */
  availableAgainAt?: string | null;
  /** In-house guest occupying the room right now (board only). */
  currentGuestName?: string | null;
  currentBookingId?: string | null;
  currentBookingReference?: string | null;
  /** Checked in but past the scheduled check-out. */
  isOverdueCheckOut?: boolean;
  /** ISO-8601 Lagos instant of the next confirmed arrival for this room. */
  nextArrivalAt?: string | null;
  nextArrivalGuestName?: string | null;
}

export interface SaveRoomRequest {
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  status: RoomStatus;
}

/* --------------------------- Guest directory ----------------------------- */

export interface GuestListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  initials: string;
  totalBookings: number;
  inHouse: boolean;
  currentRoomNumbers?: string[];
  lastStayDate?: string;
  createdAt?: string;
}

/* --------------------------------- Staff --------------------------------- */

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: StaffRole;
  isActive: boolean;
  initials: string;
}

export interface SaveStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: StaffRole;
  /** Required when creating a staff member. */
  password?: string;
}

/* --------------------------- Users (directory) --------------------------- */

/**
 * A customer account as shown in the admin user directory. Staff are managed
 * through the staff section instead; this is where customer accounts live and
 * where an administrator can promote one to a staff role.
 */
export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  bookingsCount: number;
  initials: string;
}

/** Exactly one role per account; sending this replaces the current role. */
export interface ChangeUserRoleRequest {
  role: UserRole;
}

/* -------------------------------- Payments ------------------------------- */

export interface RecordPaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  /** Optional display-only label; not persisted by the backend. */
  payerName?: string;
  /** Transaction reference. Required for POS and Bank transfer. */
  reference?: string | null;
  notes?: string | null;
}

/** Row shape used by the payment lists across the portals. */
export interface PaymentListItem {
  id: string;
  bookingId: string;
  bookingReference: string;
  guestName: string;
  payerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  /** Staff name behind the desk when the money was recorded. */
  recordedByName: string;
  /** ISO date-time the payment was received. */
  paidAt: string;
}

/** The full stored payment record (superset of the list row). */
export type Payment = PaymentListItem;

/* ----------------------------- Me / customer ----------------------------- */

export interface MeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface SaveProfileRequest {
  firstName: string;
  lastName: string;
  /** Ignored by the API: email changes aren't supported yet. */
  email?: string;
  phoneNumber?: string;
}

/* ----------------------------- Admin / misc ------------------------------ */

export interface AdminDashboard {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  activeBookings: number;
  monthlyRevenue: number;
  totalRevenue: number;
  /** Operational counts (SoT v1.12). */
  availableNow: number;
  inHouse: number;
  overdueCheckOuts: number;
  roomsFreeingToday: number;
  revenueTrend: { date: string; revenue: number }[];
  bookingsByStatus: { status: BookingStatus; count: number }[];
  roomTypePerformance: {
    roomTypeId: string;
    name: string;
    bookedNights: number;
    revenue: number;
  }[];
}

export interface AdminReports {
  occupancyRate: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  averageStayNights: number;
  revenueTrend: { date: string; revenue: number }[];
  bookingsByStatus: { status: BookingStatus; count: number }[];
  bookingsByPaymentMethod: { paymentMethod: PaymentMethod; count: number }[];
}

export interface ActivityLog {
  id: string;
  /** Mapped audit action; falls back to the raw backend action when unknown. */
  type: string;
  message: string;
  actorName: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface HotelSettings {
  hotelName: string;
  addressLine1: string;
  addressLine2: string;
  phoneNumber: string;
  email: string;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  maxRoomsPerBooking: number;
  /** Hours before check-in that a cancellation is allowed (backend-managed). */
  cancellationWindowHours?: number;
  /** Checks-in are refused while an amount is outstanding (backend-managed, default off). */
  requireFullPaymentAtCheckIn?: boolean;
  /** Check-outs are refused while an amount is outstanding (backend-managed, default off). */
  requirePaymentBeforeCheckOut?: boolean;
  /** Early check-outs require an administrator, not just a receptionist (default off). */
  earlyCheckOutRequiresAdmin?: boolean;
  /* ---- Stay policy (SoT v1.12) ---- */
  /** Times must align to this many minutes. */
  timeSlotMinutes?: number;
  earliestCheckInTime?: string;
  latestCheckInTime?: string;
  earliestCheckOutTime?: string;
  latestCheckOutTime?: string;
  /** Minutes a room must rest between stays. */
  turnaroundMinutes?: number;
  /** Hard cap on how many nights a single stay may be booked for. */
  maxStayNights?: number;
  /** Overstay hours up to this amount are free (no extended-stay surcharge). */
  graceHours?: number;
  /* ---- Check-out reminders (SoT v1.16) ---- */
  /** Minutes before a checked-in stay's scheduled check-out to email the front desk. */
  checkOutReminderLeadMinutes?: number;
  /** Comma-separated staff inboxes for reminders (empty falls back to the desk inbox). */
  receptionNotificationEmails?: string;
}

export type SaveSettingsRequest = Partial<HotelSettings>;