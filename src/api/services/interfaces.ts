/**
 * Service interfaces — the single seam between the UI and the network.
 *
 * Components and hooks only ever talk to these interfaces (through the
 * `services` registry). Real and mock adapters both implement them, so the UI
 * rehearses identical rules regardless of which one is active.
 */
import type {
  AdminDashboard,
  AdminReports,
  ActivityLog,
  AnonymousCancelBookingRequest,
  AppNotification,
  AssignRoomsRequest,
  AuthResponse,
  AvailabilityResponse,
  AvailabilitySearchRequest,
  BookingListItem,
  BookingLookupRequest,
  BookingResponse,
  CancelBookingRequest,
  ConfirmEmailRequest,
  CreateBookingRequest,
  ForgotPasswordRequest,
  GuestListItem,
  HotelSettings,
  LoginRequest,
  MeProfile,
  MessageResponse,
  Paginated,
  Payment,
  PaymentListItem,
  RecordPaymentRequest,
  RegisterRequest,
  ResetPasswordRequest,
  Room,
  RoomTypeResponse,
  SaveProfileRequest,
  SaveRoomRequest,
  SaveRoomTypeRequest,
  SaveStaffRequest,
  SaveSettingsRequest,
  Staff,
  UploadedImage,
  User,
} from '@/types';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Room board list: filter by date-aware status, free-text and page. */
export interface RoomListParams extends PaginationParams {
  status?: string;
  /** "yyyy-MM-dd" occupancy date; defaults to today on the backend. */
  date?: string;
}

export interface BookingFilterParams extends PaginationParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Column to order the filtered results by. */
  sort?: 'createdAt' | 'updatedAt';
  direction?: 'asc' | 'desc';
}

export interface AuthApi {
  register(request: RegisterRequest): Promise<AuthResponse>;
  login(request: LoginRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
  forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse>;
  resetPassword(request: ResetPasswordRequest): Promise<MessageResponse>;
  confirmEmail(request: ConfirmEmailRequest): Promise<MessageResponse>;
}

export interface RoomTypesApi {
  list(): Promise<RoomTypeResponse[]>;
  get(id: string): Promise<RoomTypeResponse>;
}

export interface AvailabilityApi {
  search(request: AvailabilitySearchRequest): Promise<AvailabilityResponse>;
}

export interface UploadsApi {
  /** Uploads a room image to Cloudinary via POST /uploads/images (admin only). */
  uploadImage(file: File): Promise<UploadedImage>;
}

export interface BookingsApi {
  create(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse>;
  lookup(request: BookingLookupRequest): Promise<BookingResponse>;
  cancel(request: AnonymousCancelBookingRequest): Promise<BookingResponse>;
}

export interface MeApi {
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>>;
  getBooking(id: string): Promise<BookingResponse>;
  cancelBooking(id: string, request: CancelBookingRequest): Promise<BookingResponse>;
  getProfile(): Promise<MeProfile>;
  updateProfile(request: SaveProfileRequest): Promise<MeProfile>;
}

export interface ReceptionApi {
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>>;
  getBooking(id: string): Promise<BookingResponse>;
  createBooking(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse>;
  assignRooms(id: string, request: AssignRoomsRequest): Promise<BookingResponse>;
  checkIn(id: string): Promise<BookingResponse>;
  checkOut(id: string): Promise<BookingResponse>;
  listRooms(params: RoomListParams): Promise<Paginated<Room>>;
  listGuests(params: PaginationParams): Promise<Paginated<GuestListItem>>;
  listPayments(params: PaginationParams): Promise<Paginated<PaymentListItem>>;
  recordPayment(request: RecordPaymentRequest): Promise<Payment>;
}

export interface AdminApi {
  dashboard(): Promise<AdminDashboard>;
  listRooms(params: RoomListParams): Promise<Paginated<Room>>;
  createRoom(request: SaveRoomRequest): Promise<Room>;
  getRoom(id: string): Promise<Room>;
  updateRoom(id: string, request: SaveRoomRequest): Promise<Room>;
  updateRoomStatus(id: string, status: Room['status']): Promise<Room>;
  listRoomTypes(params: PaginationParams): Promise<Paginated<RoomTypeResponse>>;
  createRoomType(request: SaveRoomTypeRequest): Promise<RoomTypeResponse>;
  getRoomType(id: string): Promise<RoomTypeResponse>;
  updateRoomType(id: string, request: SaveRoomTypeRequest): Promise<RoomTypeResponse>;
  updateRoomTypeStatus(id: string, isActive: boolean): Promise<RoomTypeResponse>;
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>>;
  listGuests(params: PaginationParams): Promise<Paginated<GuestListItem>>;
  listStaff(params: PaginationParams): Promise<Paginated<Staff>>;
  createStaff(request: SaveStaffRequest): Promise<Staff>;
  getStaff(id: string): Promise<Staff>;
  updateStaff(id: string, request: SaveStaffRequest): Promise<Staff>;
  updateStaffStatus(id: string, isActive: boolean): Promise<Staff>;
  listPayments(params: PaginationParams): Promise<Paginated<PaymentListItem>>;
  reports(): Promise<AdminReports>;
  listActivityLogs(params: PaginationParams): Promise<Paginated<ActivityLog>>;
  listNotifications(params: PaginationParams): Promise<Paginated<AppNotification>>;
  getSettings(): Promise<HotelSettings>;
  updateSettings(request: SaveSettingsRequest): Promise<HotelSettings>;
}

export interface ServiceCollection {
  auth: AuthApi;
  roomTypes: RoomTypesApi;
  availability: AvailabilityApi;
  uploads: UploadsApi;
  bookings: BookingsApi;
  me: MeApi;
  reception: ReceptionApi;
  admin: AdminApi;
}