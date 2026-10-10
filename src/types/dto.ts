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
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
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
  email: string;
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
  guestEmail: string;
  roomsCount: number;
  roomsSummary: string;
  totalAmount: number;
  createdAt: string;
}

export interface CancelBookingRequest {
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
  status: RoomStatus;
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
}

/* -------------------------------- Payments ------------------------------- */

export interface RecordPaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingReference: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  recordedAt: string;
}

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
  type: 'BookingCreated' | 'BookedRoomsAssigned' | 'BookingCheckedIn' | 'BookingCheckedOut' | 'BookingCancelled' | 'PaymentRecorded' | 'RoomStatusChanged' | 'RoomTypeCreated' | 'RoomTypeUpdated' | 'StaffCreated' | 'StaffUpdated';
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
}

export type SaveSettingsRequest = Partial<HotelSettings>;