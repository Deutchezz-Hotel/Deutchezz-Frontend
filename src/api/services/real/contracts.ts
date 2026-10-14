/**
 * Backend wire contracts (JSON as served by the ASP.NET Core API under /api/v1).
 *
 * These mirror the C# DTOs exactly. Everything in the UI talks to the view
 * models in `@/types`; `mappers.ts` converts these wire shapes into those view
 * models so components never see the raw backend fields.
 *
 * Source of truth: the backend DTO catalog (SOURCE_OF_TRUTH.md §8/§9).
 */

/** Paged envelope: { items, page, pageSize, totalCount, totalPages }. */
export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/* ------------------------------- Auth ------------------------------------ */

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  role: string;
}

export interface CurrentUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface MessageResponse {
  message: string;
}

/** 202 body for register/resend/forgot (no account enumeration). */
export interface RegisterPendingResponse {
  message: string;
  resendAvailableInSeconds: number;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/* -------------------------------- Uploads -------------------------------- */

export interface UploadedImage {
  url: string;
  publicId: string;
}

/* ------------------------------ Room types ------------------------------- */

export interface RoomTypeListItemResponse {
  id: string;
  name: string;
  basePrice: number;
  maximumOccupancy: number;
  bedType: string | null;
  isActive: boolean;
}

export interface RoomTypeResponse {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  maximumOccupancy: number;
  bedType: string | null;
  isActive: boolean;
  imageUrls: string[];
  features: string[];
}

export interface SaveRoomTypeRequest {
  name: string;
  description?: string | null;
  basePrice: number;
  maximumOccupancy: number;
  bedType?: string | null;
  imageUrls?: string[] | null;
  features?: string[] | null;
}

/* ----------------------------- Availability ------------------------------ */

export interface AvailabilitySearchRequest {
  checkInDate: string;
  checkInTime?: string | null;
  checkOutDate: string;
  checkOutTime?: string | null;
  adults: number;
  children: number;
  rooms: number;
}

export interface AvailableRoomTypeResponse {
  roomTypeId: string;
  name: string;
  basePrice: number;
  maximumOccupancy: number;
  capacity: number;
  booked: number;
  available: number;
}

export interface AvailabilityResponse {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  /** ISO-8601 with the Lagos offset. */
  checkInAt: string;
  /** ISO-8601 with the Lagos offset. */
  checkOutAt: string;
  roomTypes: AvailableRoomTypeResponse[];
}

/* ------------------------------ Stay policy ------------------------------ */

export interface StayPolicyResponse {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  timeSlotMinutes: number;
  earliestCheckInTime: string;
  latestCheckInTime: string;
  earliestCheckOutTime: string;
  latestCheckOutTime: string;
  maxExtraHoursPerStay: number;
  turnaroundMinutes: number;
  graceHours: number;
  halfDayHours: number;
  halfDayPercent: number;
  fullNightPercent: number;
}

/** One conflicted room inside a 409 `room.occupied_until` `errors` array. */
export interface RoomConflictWire {
  roomId: string;
  roomNumber: string;
  occupiedUntil: string;
  occupantGuestName: string | null;
  occupantBookingReference: string | null;
  requestedCheckInAt: string;
}

/* ------------------------------- Bookings -------------------------------- */

export interface GuestInfoRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface BookingRoomRequest {
  roomTypeId: string;
  quantity: number;
}

export interface CreateBookingRequest {
  checkInDate: string;
  checkInTime?: string | null;
  checkOutDate: string;
  checkOutTime?: string | null;
  adults: number;
  children: number;
  guest: GuestInfoRequest;
  rooms: BookingRoomRequest[];
  specialRequests?: string | null;
  /** Proceed past the possible-duplicate warning (SoT v1.10, 7m). */
  acknowledgeDuplicate?: boolean;
}

export interface ReceptionGuestRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ReceptionCreateBookingRequest {
  checkInDate: string;
  checkInTime?: string | null;
  checkOutDate: string;
  checkOutTime?: string | null;
  adults: number;
  children: number;
  guest: ReceptionGuestRequest;
  rooms: BookingRoomRequest[];
}

export interface ReceptionCancelBookingRequest {
  reason: string;
  notes?: string | null;
  refundPaidAmounts: boolean;
}

export interface BookingLookupRequest {
  bookingReference: string;
  email: string;
}

export interface CancelBookingRequest {
  reason?: string | null;
}

export interface BookingRoomTypeLineResponse {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  subtotal: number;
  extraCharge: number;
}

export interface RoomAssignmentResponse {
  id: string;
  roomId: string;
  roomNumber: string;
  bookingRoomTypeId: string;
  roomTypeId: string;
  assignedAt: string;
  releasedAt: string | null;
}

export interface PaymentSummary {
  totalPaid: number;
  balance: number;
}

export interface BookingDetailResponse {
  id: string;
  bookingReference: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhoneNumber: string | null;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  checkInAt: string;
  checkOutAt: string;
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  nights: number;
  adults: number;
  children: number;
  specialRequests: string | null;
  status: string;
  paymentStatus: string;
  source: string;
  createdByName: string | null;
  totalAmount: number;
  lines: BookingRoomTypeLineResponse[];
  assignments: RoomAssignmentResponse[];
  payments: PaymentSummary;
  createdAt: string;
  extraChargeAmount: number;
  /** ISO-8601 instant the booking was cancelled, or null (retention, SoT v1.12). */
  cancelledAt?: string | null;
  /** When a cancelled, unpaid booking will be permanently purged, or null. */
  purgeScheduledAt?: string | null;
  /** True when at least one payment exists (holds a cancelled booking for refund review). */
  hasPayments?: boolean;
}

export interface BookingListItemResponse {
  id: string;
  bookingReference: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhoneNumber: string | null;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  checkInAt: string;
  checkOutAt: string;
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  status: string;
  paymentStatus: string;
  source: string;
  createdByName: string | null;
  totalAmount: number;
  /** Outstanding balance (total minus paid payments); 0 once fully paid. */
  balanceDue: number;
}

export interface CreateBookingResponse {
  booking: BookingDetailResponse;
  suggestAccount: boolean;
  replay: boolean;
}

export interface CheckInResponse {
  bookingId: string;
  bookingReference: string;
  status: string;
  checkedInAt: string;
  roomNumbers: string[];
}

export interface CheckOutResponse {
  bookingId: string;
  bookingReference: string;
  status: string;
  checkedOutAt: string;
  releasedRoomNumbers: string[];
  isEarly: boolean;
  scheduledCheckOutAt: string;
  actualCheckOutAt: string;
}

export interface EarlyCheckOutInfo {
  reason: string;
  notes?: string | null;
  guestConsented: boolean;
}

export interface CheckOutRequest {
  earlyCheckOut?: EarlyCheckOutInfo | null;
}

export interface ChangeRoomTypeRequest {
  bookingRoomTypeId: string;
  newRoomTypeId: string;
  quantity: number;
}

export interface ChangeRoomTypeResponse {
  booking: BookingDetailResponse;
  assignmentsCleared: string[];
}

export interface ReassignRoomRequest {
  roomAssignmentId: string;
  newRoomId: string;
  reason?: string | null;
  /** Proceed when the room frees before the stay (SoT v1.12). */
  acknowledgeLateAvailability?: boolean;
}

export interface UnassignRoomRequest {
  roomAssignmentId: string;
}

export interface RoomAssignmentLineRequest {
  bookingRoomTypeId: string;
  roomId: string;
}

export interface RoomAssignmentRequest {
  assignments: RoomAssignmentLineRequest[];
  /** Proceed when a room frees before the stay (SoT v1.12). */
  acknowledgeLateAvailability?: boolean;
}

/* --------------------------------- Rooms --------------------------------- */

export interface RoomListItemResponse {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  status: string;
  floor: string | null;
  effectiveStatus: string;
  /** ISO-8601 Lagos instants; null/absent when the room is free. */
  occupiedUntil?: string | null;
  availableAgainAt?: string | null;
  currentGuestName?: string | null;
  currentBookingId?: string | null;
  currentBookingReference?: string | null;
  isOverdueCheckOut?: boolean;
  nextArrivalAt?: string | null;
  nextArrivalGuestName?: string | null;
}

export interface RoomResponse {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  status: string;
  floor: string | null;
  isActive: boolean;
  effectiveStatus: string;
}

export interface CreateRoomRequest {
  roomNumber: string;
  roomTypeId: string;
  floor?: string | null;
}

export interface UpdateRoomRequest {
  roomNumber?: string | null;
  roomTypeId?: string | null;
  floor?: string | null;
}

export interface SetRoomStatusRequest {
  status: string;
}

/* --------------------------------- Guests -------------------------------- */

export interface GuestResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  userId: string | null;
  createdAt: string;
}

/* --------------------------------- Staff --------------------------------- */

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: string | null;
}

export interface SetStaffStatusRequest {
  isActive: boolean;
}

export interface StaffResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

/* --------------------------------- Users --------------------------------- */

export interface UserListItemResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  bookingsCount: number;
}

export interface ChangeUserRoleRequest {
  role: string;
}

/* -------------------------------- Payments ------------------------------- */

export interface RecordPaymentRequest {
  bookingId: string;
  amount: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  recordedByUserId: string | null;
}

export interface PaymentListItemResponse {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  bookingReference: string;
  guestName: string;
  reference: string | null;
}

/* ------------------------------- Profile --------------------------------- */

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
}

/* ------------------------------ Notifications ---------------------------- */

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/* -------------------------------- Reports -------------------------------- */

export interface BookingStatusCountResponse {
  status: string;
  count: number;
}

export interface DailyRevenueResponse {
  date: string;
  revenue: number;
}

export interface DashboardResponse {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  inactiveRooms: number;
  todayBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  activeBookings: number;
  revenueToday: number;
  occupancyPercentage: number;
  /** Operational counts (SoT v1.12). */
  availableNow: number;
  inHouse: number;
  overdueCheckOuts: number;
  roomsFreeingToday: number;
  bookingsByStatus: BookingStatusCountResponse[];
  revenueTrend: DailyRevenueResponse[];
}

export interface DailyMetric {
  date: string;
  bookings: number;
  revenue: number;
}

export interface ReportResponse {
  from: string;
  to: string;
  bookingsCount: number;
  nightsBooked: number;
  roomsBooked: number;
  revenue: number;
  outstanding: number;
  cancelled: number;
  roomNightsSold: number;
  roomNightsCapacity: number;
  occupancyRate: number;
  daily: DailyMetric[];
}

/* ------------------------------ Activity logs ---------------------------- */

export interface ActivityLogResponse {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

/* ------------------------------- Settings -------------------------------- */

export interface AdminSettingsResponse {
  maxRoomsPerBooking: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationWindowHours: number;
  requireFullPaymentAtCheckIn: boolean;
  requirePaymentBeforeCheckOut: boolean;
  earlyCheckOutRequiresAdmin: boolean;
  timeSlotMinutes: number;
  earliestCheckInTime: string;
  latestCheckInTime: string;
  earliestCheckOutTime: string;
  latestCheckOutTime: string;
  maxExtraHoursPerStay: number;
  turnaroundMinutes: number;
}

export interface UpdateAdminSettingsRequest {
  maxRoomsPerBooking?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  cancellationWindowHours?: number | null;
  requireFullPaymentAtCheckIn?: boolean | null;
  requirePaymentBeforeCheckOut?: boolean | null;
  earlyCheckOutRequiresAdmin?: boolean | null;
  timeSlotMinutes?: number | null;
  earliestCheckInTime?: string | null;
  latestCheckInTime?: string | null;
  earliestCheckOutTime?: string | null;
  latestCheckOutTime?: string | null;
  maxExtraHoursPerStay?: number | null;
  turnaroundMinutes?: number | null;
}

/* ---------------------------- Problem details ---------------------------- */

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  /** Field validation errors, or (for `room.occupied_until`) an array of RoomConflictWire. */
  errors?: Record<string, string[]> | RoomConflictWire[];
  minutesAgo?: number;
  reference?: string;
  bookingId?: string;
  /* --- Late-availability conflict (room.available_later, v1.12) --- */
  roomId?: string;
  roomNumber?: string;
  /** ISO-8601 Lagos instant the room frees up. */
  availableFrom?: string;
}
