/**
 * API DTOs.
 *
 * These mirror the backend contract and live in one place so they can be
 * swapped for generated types (openapi-typescript) once the backend publishes
 * http://localhost:5144/openapi/v1.json. Do not scatter DTO shapes elsewhere.
 *
 * Conventions:
 *  - JSON camelCase.
 *  - Dates are "yyyy-MM-dd" strings.
 *  - Money is a decimal number in NGN (no taxes or fees exist yet).
 */
import type {
  BookingSource,
  BookingStatus,
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
  checkOutDate: string;
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
  checkOutDate: string;
  nights: number;
  totalAvailableRooms: number;
  roomTypes: AvailableRoomTypeResponse[];
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
  checkOutDate: string;
  adults: number;
  children: number;
  guest: BookingGuest;
  rooms: BookingRoomRequest[];
  specialRequests?: string | null;
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
  checkOutDate: string;
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

export interface BookingRoomLine {
  bookingRoomTypeId: string;
  roomTypeId: string;
  roomTypeName: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  subtotal: number;
  assignedRoomNumbers?: string[];
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  guest: BookingGuest;
  rooms: BookingRoomLine[];
  specialRequests: string | null;
  totalAmount: number;
  createdAt: string;
  /** How the booking was created. */
  source: BookingSource;
  /** Staff member who created the booking at the desk; null for online bookings. */
  createdByName: string | null;
  /** "yyyy-MM-dd" — bumped on any lifecycle change (rooms assigned, checked in, payment recorded, cancelled). */
  updatedAt: string;
  /**
   * Live payment summary from the backend booking detail. Optional because the
   * mock adapter and list endpoints don't populate it.
   */
  payments?: { totalPaid: number; balance: number };
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
  /** Occupancy for the requested board date; falls back to `status` when absent. */
  effectiveStatus?: RoomStatus;
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
  /** Required when creating a staff member; ignored on update. */
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
  email: string;
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
}

export type SaveSettingsRequest = Partial<HotelSettings>;