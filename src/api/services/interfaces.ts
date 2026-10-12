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
  BookingSource,
  BookingResponse,
  CancelBookingRequest,
  ChangeRoomTypeRequest,
  ChangeRoomTypeResult,
  ChangeUserRoleRequest,
  CheckOutRequest,
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
  ReassignRoomRequest,
  ReceptionCancelBookingRequest,
  ReceptionCreateBookingRequest,
  RecordPaymentRequest,
  RegisterPendingResponse,
  RegisterRequest,
  ResendCodeRequest,
  ResetPasswordRequest,
  Room,
  RoomTypeResponse,
  SaveProfileRequest,
  SaveRoomRequest,
  SaveRoomTypeRequest,
  SaveStaffRequest,
  SaveSettingsRequest,
  Staff,
  UnassignRoomRequest,
  UploadedImage,
  User,
  UserListItem,
  UserRole,
  VerifyEmailRequest,
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
  /** Restrict to a single room type. */
  roomTypeId?: string;
  /**
   * When both are set ("yyyy-MM-dd", half-open `[availableFrom, availableTo)`)
   * the backend returns only rooms free for the whole stay. Supplying one alone
   * (or `from >= to`) is rejected by the backend.
   */
  availableFrom?: string;
  availableTo?: string;
}

export interface BookingFilterParams extends PaginationParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Filter by how the booking was created. */
  source?: BookingSource;
  /** Reception only: confirmed bookings whose check-in date has already passed. */
  overdueArrivals?: boolean;
  /** Column to order the filtered results by. */
  sort?: 'createdAt' | 'updatedAt';
  direction?: 'asc' | 'desc';
}

/** Admin user directory: customers by default; broaden with `role`. */
export interface UserListParams extends PaginationParams {
  role?: UserRole;
  sort?: 'firstName' | 'lastName' | 'email' | 'isActive' | 'createdAt' | 'lastLoginAt';
  direction?: 'asc' | 'desc';
}

export interface AuthApi {
  /** Starts account creation. Returns 202 with a neutral body; no session yet. */
  register(request: RegisterRequest): Promise<RegisterPendingResponse>;
  /** Confirms the emailed code and signs the new customer in. */
  verifyEmail(request: VerifyEmailRequest): Promise<AuthResponse>;
  /** Re-sends the verification code (rate-limited); neutral 202 body. */
  resendCode(request: ResendCodeRequest): Promise<RegisterPendingResponse>;
  login(request: LoginRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
  /** Sends a reset code; always neutral 202. */
  forgotPassword(request: ForgotPasswordRequest): Promise<RegisterPendingResponse>;
  resetPassword(request: ResetPasswordRequest): Promise<MessageResponse>;
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
  /** Creates a walk-in booking. Sends the guest to the desk's email, never the client. */
  createBooking(request: ReceptionCreateBookingRequest, idempotencyKey: string): Promise<BookingResponse>;
  /** Cancels a Pending/Confirmed booking with a reason and refund choice. */
  cancelBooking(id: string, request: ReceptionCancelBookingRequest): Promise<BookingResponse>;
  assignRooms(id: string, request: AssignRoomsRequest): Promise<BookingResponse>;
  checkIn(id: string): Promise<BookingResponse>;
  /** Checks out a booking. Pass `earlyCheckOut` when before the scheduled moment. */
  checkOut(id: string, request?: CheckOutRequest): Promise<BookingResponse>;
  /** Moves part of a room line to another room type (before check-in). */
  changeRoomType(id: string, request: ChangeRoomTypeRequest): Promise<ChangeRoomTypeResult>;
  /** Swaps a live room assignment for another room of the same type. */
  reassignRoom(id: string, request: ReassignRoomRequest): Promise<BookingResponse>;
  /** Releases a live room assignment before check-in. */
  unassignRoom(id: string, request: UnassignRoomRequest): Promise<BookingResponse>;
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
  listUsers(params: UserListParams): Promise<Paginated<UserListItem>>;
  listStaff(params: PaginationParams): Promise<Paginated<Staff>>;  createStaff(request: SaveStaffRequest): Promise<Staff>;
  getStaff(id: string): Promise<Staff>;
  updateStaff(id: string, request: SaveStaffRequest): Promise<Staff>;
  updateStaffStatus(id: string, isActive: boolean): Promise<Staff>;
  changeUserRole(id: string, request: ChangeUserRoleRequest): Promise<UserListItem>;
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