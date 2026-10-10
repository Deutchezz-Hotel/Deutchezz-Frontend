/**
 * Real (fetch) implementations of the service interfaces. Each method maps to
 * exactly one endpoint from the backend contract (all under VITE_API_URL).
 */
import { http } from '@/api/http';
import type {
  AdminDashboard,
  AdminReports,
  ActivityLog,
  AppNotification,
  AssignRoomsRequest,
  AuthResponse,
  AvailabilityResponse,
  AvailabilitySearchRequest,
  BookingListItem,
  BookingLookupRequest,
  BookingResponse,
  CancelBookingRequest,
  CreateBookingRequest,
  GuestListItem,
  HotelSettings,
  LoginRequest,
  MeProfile,
  Paginated,
  Payment,
  RecordPaymentRequest,
  RegisterRequest,
  Room,
  RoomTypeResponse,
  SaveProfileRequest,
  SaveRoomRequest,
  SaveRoomTypeRequest,
  SaveSettingsRequest,
  SaveStaffRequest,
  Staff,
  User,
} from '@/types';

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

type PathOptions = { path: string; method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; skipAuth?: boolean; idempotencyKey?: string };

function call<T>(options: PathOptions): Promise<T> {
  return http<T>(options);
}

export const realAuthApi = {
  register(request: RegisterRequest): Promise<AuthResponse> {
    return call<AuthResponse>({ path: '/auth/register', method: 'POST', body: request, skipAuth: true });
  },
  login(request: LoginRequest): Promise<AuthResponse> {
    return call<AuthResponse>({ path: '/auth/login', method: 'POST', body: request, skipAuth: true });
  },
  logout(): Promise<void> {
    return call<void>({ path: '/auth/logout', method: 'POST' });
  },
  me(): Promise<User> {
    return call<User>({ path: '/auth/me' });
  },
};

export const realRoomTypesApi = {
  list(): Promise<RoomTypeResponse[]> {
    return call<RoomTypeResponse[]>({ path: '/room-types', skipAuth: true });
  },
  get(id: string): Promise<RoomTypeResponse> {
    return call<RoomTypeResponse>({ path: `/room-types/${encodeURIComponent(id)}`, skipAuth: true });
  },
};

export const realAvailabilityApi = {
  search(request: AvailabilitySearchRequest): Promise<AvailabilityResponse> {
    return call<AvailabilityResponse>({ path: '/availability/search', method: 'POST', body: request, skipAuth: true });
  },
};

export const realBookingsApi = {
  create(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: '/bookings', method: 'POST', body: request, skipAuth: true, idempotencyKey });
  },
  lookup(request: BookingLookupRequest): Promise<BookingResponse> {
    return call<BookingResponse>({ path: '/bookings/lookup', method: 'POST', body: request, skipAuth: true });
  },
};

export const realMeApi = {
  listBookings(params: Record<string, string | number | undefined>): Promise<Paginated<BookingListItem>> {
    return call<Paginated<BookingListItem>>({ path: `/me/bookings${buildQuery(params)}` });
  },
  getBooking(id: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/me/bookings/${encodeURIComponent(id)}` });
  },
  cancelBooking(id: string, request: CancelBookingRequest): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/me/bookings/${encodeURIComponent(id)}/cancel`, method: 'POST', body: request });
  },
  getProfile(): Promise<MeProfile> {
    return call<MeProfile>({ path: '/me/profile' });
  },
  updateProfile(request: SaveProfileRequest): Promise<MeProfile> {
    return call<MeProfile>({ path: '/me/profile', method: 'PUT', body: request });
  },
};

export const realReceptionApi = {
  listBookings(params: Record<string, string | number | undefined>): Promise<Paginated<BookingListItem>> {
    return call<Paginated<BookingListItem>>({ path: `/reception/bookings${buildQuery(params)}` });
  },
  getBooking(id: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}` });
  },
  createBooking(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: '/reception/bookings', method: 'POST', body: request, idempotencyKey });
  },
  assignRooms(id: string, request: AssignRoomsRequest): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/assign-rooms`, method: 'POST', body: request });
  },
  checkIn(id: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/check-in`, method: 'POST' });
  },
  checkOut(id: string): Promise<BookingResponse> {
    return call<BookingResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/check-out`, method: 'POST' });
  },
  listRooms(params: Record<string, string | number | undefined>): Promise<Paginated<Room>> {
    return call<Paginated<Room>>({ path: `/reception/rooms${buildQuery(params)}` });
  },
  listGuests(params: Record<string, string | number | undefined>): Promise<Paginated<GuestListItem>> {
    return call<Paginated<GuestListItem>>({ path: `/reception/guests${buildQuery(params)}` });
  },
  listPayments(params: Record<string, string | number | undefined>): Promise<Paginated<Payment>> {
    return call<Paginated<Payment>>({ path: `/reception/payments${buildQuery(params)}` });
  },
  recordPayment(request: RecordPaymentRequest): Promise<Payment> {
    return call<Payment>({ path: '/reception/payments', method: 'POST', body: request });
  },
};

export const realAdminApi = {
  dashboard(): Promise<AdminDashboard> {
    return call<AdminDashboard>({ path: '/admin/dashboard' });
  },
  listRooms(params: Record<string, string | number | undefined>): Promise<Paginated<Room>> {
    return call<Paginated<Room>>({ path: `/admin/rooms${buildQuery(params)}` });
  },
  createRoom(request: SaveRoomRequest): Promise<Room> {
    return call<Room>({ path: '/admin/rooms', method: 'POST', body: request });
  },
  getRoom(id: string): Promise<Room> {
    return call<Room>({ path: `/admin/rooms/${encodeURIComponent(id)}` });
  },
  updateRoom(id: string, request: SaveRoomRequest): Promise<Room> {
    return call<Room>({ path: `/admin/rooms/${encodeURIComponent(id)}`, method: 'PUT', body: request });
  },
  updateRoomStatus(id: string, status: Room['status']): Promise<Room> {
    return call<Room>({ path: `/admin/rooms/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { status } });
  },
  listRoomTypes(params: Record<string, string | number | undefined>): Promise<Paginated<RoomTypeResponse>> {
    return call<Paginated<RoomTypeResponse>>({ path: `/admin/room-types${buildQuery(params)}` });
  },
  createRoomType(request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    return call<RoomTypeResponse>({ path: '/admin/room-types', method: 'POST', body: request });
  },
  getRoomType(id: string): Promise<RoomTypeResponse> {
    return call<RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}` });
  },
  updateRoomType(id: string, request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    return call<RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}`, method: 'PUT', body: request });
  },
  updateRoomTypeStatus(id: string, isActive: boolean): Promise<RoomTypeResponse> {
    return call<RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { isActive } });
  },
  listBookings(params: Record<string, string | number | undefined>): Promise<Paginated<BookingListItem>> {
    return call<Paginated<BookingListItem>>({ path: `/admin/bookings${buildQuery(params)}` });
  },
  listGuests(params: Record<string, string | number | undefined>): Promise<Paginated<GuestListItem>> {
    return call<Paginated<GuestListItem>>({ path: `/admin/guests${buildQuery(params)}` });
  },
  listStaff(params: Record<string, string | number | undefined>): Promise<Paginated<Staff>> {
    return call<Paginated<Staff>>({ path: `/admin/staff${buildQuery(params)}` });
  },
  createStaff(request: SaveStaffRequest): Promise<Staff> {
    return call<Staff>({ path: '/admin/staff', method: 'POST', body: request });
  },
  getStaff(id: string): Promise<Staff> {
    return call<Staff>({ path: `/admin/staff/${encodeURIComponent(id)}` });
  },
  updateStaff(id: string, request: SaveStaffRequest): Promise<Staff> {
    return call<Staff>({ path: `/admin/staff/${encodeURIComponent(id)}`, method: 'PUT', body: request });
  },
  updateStaffStatus(id: string, isActive: boolean): Promise<Staff> {
    return call<Staff>({ path: `/admin/staff/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { isActive } });
  },
  listPayments(params: Record<string, string | number | undefined>): Promise<Paginated<Payment>> {
    return call<Paginated<Payment>>({ path: `/admin/payments${buildQuery(params)}` });
  },
  reports(): Promise<AdminReports> {
    return call<AdminReports>({ path: '/admin/reports' });
  },
  listActivityLogs(params: Record<string, string | number | undefined>): Promise<Paginated<ActivityLog>> {
    return call<Paginated<ActivityLog>>({ path: `/admin/activity-logs${buildQuery(params)}` });
  },
  listNotifications(params: Record<string, string | number | undefined>): Promise<Paginated<AppNotification>> {
    return call<Paginated<AppNotification>>({ path: `/admin/notifications${buildQuery(params)}` });
  },
  getSettings(): Promise<HotelSettings> {
    return call<HotelSettings>({ path: '/admin/settings' });
  },
  updateSettings(request: SaveSettingsRequest): Promise<HotelSettings> {
    return call<HotelSettings>({ path: '/admin/settings', method: 'PUT', body: request });
  },
};

export const realServices = {
  auth: realAuthApi,
  roomTypes: realRoomTypesApi,
  availability: realAvailabilityApi,
  bookings: realBookingsApi,
  me: realMeApi,
  reception: realReceptionApi,
  admin: realAdminApi,
};