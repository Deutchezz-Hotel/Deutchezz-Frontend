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
  checkOutDate: string;
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
  checkOutDate: string;
  roomTypes: AvailableRoomTypeResponse[];
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
  checkOutDate: string;
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
  checkOutDate: string;
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
  checkOutDate: string;
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
}

export interface BookingListItemResponse {
  id: string;
  bookingReference: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhoneNumber: string | null;
  checkInDate: string;
  checkOutDate: string;
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

export interface UpdateStaffRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
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
}

export interface UpdateAdminSettingsRequest {
  maxRoomsPerBooking?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  cancellationWindowHours?: number | null;
  requireFullPaymentAtCheckIn?: boolean | null;
  requirePaymentBeforeCheckOut?: boolean | null;
  earlyCheckOutRequiresAdmin?: boolean | null;
}

/* ---------------------------- Problem details ---------------------------- */

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Record<string, string[]>;
  minutesAgo?: number;
  reference?: string;
  bookingId?: string;
}
