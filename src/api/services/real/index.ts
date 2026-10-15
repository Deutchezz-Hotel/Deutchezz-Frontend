/**
 * Real (fetch) implementations of the service interfaces.
 *
 * The backend contract and the UI view models differ in places, so every
 * response goes through `./mappers` before the UI sees it. Query strings are
 * built from the backend query DTOs, not from the UI's filter names.
 */
import { http } from '@/api/http';
import { authStorage } from '@/api/auth-storage';
import type {
  ActivityLog,
  AdminDashboard,
  AdminReports,
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
  PricingQuote,
  PricingQuoteRequest,
  ContactRequest,
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
  SaveSettingsRequest,
  SaveStaffRequest,
  Staff,
  StayPolicy,
  UnassignRoomRequest,
  UploadedImage,
  User,
  UserListItem,
  VerifyEmailRequest,
} from '@/types';
import type { BookingFilterParams, PaginationParams, RoomListParams, UserListParams } from '../interfaces';
import * as c from './contracts';
import * as m from './mappers';

type PathOptions = { path: string; method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; formData?: FormData; skipAuth?: boolean; idempotencyKey?: string };

function call<T>(options: PathOptions): Promise<T> {
  return http<T>(options);
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function pagedQuery(params?: PaginationParams & { sort?: string; direction?: string }): Record<string, string | number | undefined> {
  return {
    page: params?.page,
    pageSize: params?.pageSize,
    sort: params?.sort,
    direction: params?.direction,
  };
}

function roomQuery(params: RoomListParams): Record<string, string | number | undefined> {
  return {
    ...pagedQuery(params),
    status: params.status,
    date: params.date,
    at: params.at,
    roomTypeId: params.roomTypeId,
    availableFrom: params.availableFrom,
    availableTo: params.availableTo,
    freeFrom: params.freeFrom,
    freeTo: params.freeTo,
    search: params.search,
  };
}

function bookingQuery(params: BookingFilterParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    source: params.source,
    overdueArrivals: params.overdueArrivals ? 'true' : undefined,
    overdueCheckOuts: params.overdueCheckOuts ? 'true' : undefined,
    hasBalanceDue: params.hasBalanceDue ? 'true' : undefined,
    activeOnly: params.activeOnly ? 'true' : undefined,
    checkOutToday: params.checkOutToday ? 'true' : undefined,
    sort: params.sort,
    direction: params.direction,
    // Free-text over guest full name or booking reference (SoT v1.10, 7l).
    search: params.search,
    from: params.dateFrom,
    to: params.dateTo,
  };
}

/* ------------------------------- auth ------------------------------------ */

async function finishAuth(tokens: c.LoginResponse): Promise<AuthResponse> {
  authStorage.setAccessToken(tokens.accessToken);
  authStorage.setRefreshToken(tokens.refreshToken);
  const me = await call<c.CurrentUserResponse>({ path: '/auth/me' });
  return { user: m.toUser(me), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export const realAuthApi = {
  register(request: RegisterRequest): Promise<RegisterPendingResponse> {
    return call<c.RegisterPendingResponse>({ path: '/auth/register', method: 'POST', body: request, skipAuth: true });
  },
  async verifyEmail(request: VerifyEmailRequest): Promise<AuthResponse> {
    const tokens = await call<c.LoginResponse>({ path: '/auth/verify-email', method: 'POST', body: request, skipAuth: true });
    return finishAuth(tokens);
  },
  resendCode(request: ResendCodeRequest): Promise<RegisterPendingResponse> {
    return call<c.RegisterPendingResponse>({ path: '/auth/resend-code', method: 'POST', body: request, skipAuth: true });
  },
  async login(request: LoginRequest): Promise<AuthResponse> {
    const tokens = await call<c.LoginResponse>({ path: '/auth/login', method: 'POST', body: request, skipAuth: true });
    return finishAuth(tokens);
  },
  async logout(): Promise<void> {
    try {
      await call<void>({ path: '/auth/logout', method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },
  async me(): Promise<User> {
    const me = await call<c.CurrentUserResponse>({ path: '/auth/me' });
    return m.toUser(me);
  },
  async forgotPassword(request: ForgotPasswordRequest): Promise<RegisterPendingResponse> {
    return call<c.RegisterPendingResponse>({ path: '/auth/forgot-password', method: 'POST', body: request, skipAuth: true });
  },
  async resetPassword(request: ResetPasswordRequest): Promise<MessageResponse> {
    return call<c.MessageResponse>({ path: '/auth/reset-password', method: 'POST', body: request, skipAuth: true });
  },
};

/* ----------------------------- room types -------------------------------- */

interface RoomTypeSet {
  list: RoomTypeResponse[];
  byId: Map<string, RoomTypeResponse>;
  page: c.Paged<c.RoomTypeListItemResponse>;
}

async function loadRoomTypes(base: string, skipAuth: boolean, includeInactive: boolean): Promise<RoomTypeSet> {
  const page = await call<c.Paged<c.RoomTypeListItemResponse>>({
    path: `${base}${buildQuery({ pageSize: 100, includeInactive: includeInactive ? 'true' : undefined })}`,
    skipAuth,
  });
  // Fetch the detail of each type for its description/images/features. Public reads only
  // ever contain active types; the admin detail endpoint (used when skipAuth is false)
  // returns inactive ones too. Tolerate any detail failure so one bad row can't break
  // the whole list.
  const list = await Promise.all(
    page.items.map(async (item): Promise<RoomTypeResponse> => {
      try {
        const detail = await call<c.RoomTypeResponse>({ path: `${base}/${encodeURIComponent(item.id)}`, skipAuth });
        return m.toRoomType(detail);
      } catch {
        return m.toRoomTypeFromList(item);
      }
    }),
  );
  return { list, byId: new Map(list.map((rt) => [rt.id, rt])), page };
}

export const realRoomTypesApi = {
  list(): Promise<RoomTypeResponse[]> {
    return loadRoomTypes('/room-types', true, false).then((set) => set.list);
  },
  get(id: string): Promise<RoomTypeResponse> {
    return call<c.RoomTypeResponse>({ path: `/room-types/${encodeURIComponent(id)}`, skipAuth: true }).then(m.toRoomType);
  },
};

/* -------------------------------- uploads --------------------------------- */

export const realUploadsApi = {
  uploadImage(file: File): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append('file', file);
    // The browser sets the multipart boundary; do not set Content-Type manually.
    return call<c.UploadedImage>({ path: '/uploads/images', method: 'POST', formData });
  },
};

/* ----------------------------- availability ------------------------------ */

export const realAvailabilityApi = {
  async search(request: AvailabilitySearchRequest): Promise<AvailabilityResponse> {
    const [resp, roomTypes] = await Promise.all([
      call<c.AvailabilityResponse>({ path: '/availability/search', method: 'POST', body: request, skipAuth: true }),
      loadRoomTypes('/room-types', true, false),
    ]);
    return m.toAvailability(resp, request, roomTypes.byId);
  },
};

/* ------------------------------ stay policy ------------------------------ */

export const realStayApi = {
  getPolicy(): Promise<StayPolicy> {
    return call<c.StayPolicyResponse>({ path: '/stay-policy', skipAuth: true }).then(m.toStayPolicy);
  },
};

/* -------------------------------- pricing -------------------------------- */

export const realPricingApi = {
  quote(request: PricingQuoteRequest): Promise<PricingQuote> {
    const body: c.PricingQuoteRequest = {
      checkInDate: request.checkInDate,
      checkInTime: request.checkInTime ?? null,
      checkOutDate: request.checkOutDate,
      checkOutTime: request.checkOutTime ?? null,
      bookingType: request.bookingType ?? null,
      rooms: request.rooms.map((r) => ({ roomTypeId: r.roomTypeId, quantity: r.quantity })),
    };
    return call<c.PricingQuoteResponse>({ path: '/pricing/quote', method: 'POST', body, skipAuth: true });
  },
};

/* -------------------------------- contact -------------------------------- */

export const realContactApi = {
  send(request: ContactRequest): Promise<MessageResponse> {
    const body: c.ContactRequest = {
      name: request.name,
      email: request.email,
      message: request.message,
    };
    return call<c.MessageResponse>({ path: '/contact', method: 'POST', body, skipAuth: true });
  },
};

/* ------------------------------- bookings -------------------------------- */

async function fetchReceptionBooking(id: string): Promise<BookingResponse> {
  const detail = await call<c.BookingDetailResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}` });
  return m.toBooking(detail);
}

export const realBookingsApi = {
  create(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    // No skipAuth: when a customer is signed in the Bearer token links the booking to their
    // account (CreatedByUserId). Anonymous visitors simply have no token to send.
    return call<c.CreateBookingResponse>({ path: '/bookings', method: 'POST', body: request, idempotencyKey }).then((r) => m.toBooking(r.booking));
  },
  lookup(request: BookingLookupRequest): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: '/bookings/lookup', method: 'POST', body: request, skipAuth: true }).then(m.toBooking);
  },
  cancel(request: AnonymousCancelBookingRequest): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: '/bookings/cancel', method: 'POST', body: request, skipAuth: true }).then(m.toBooking);
  },
};

/* --------------------------------- me ------------------------------------ */

export const realMeApi = {
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>> {
    return call<c.Paged<c.BookingListItemResponse>>({ path: `/me/bookings${buildQuery(bookingQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toBookingListItem),
    );
  },
  getBooking(id: string): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: `/me/bookings/${encodeURIComponent(id)}` }).then(m.toBooking);
  },
  cancelBooking(id: string, request: CancelBookingRequest): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: `/me/bookings/${encodeURIComponent(id)}/cancel`, method: 'POST', body: request }).then(m.toBooking);
  },
  getProfile(): Promise<MeProfile> {
    return call<c.ProfileResponse>({ path: '/me/profile' }).then(m.toMeProfile);
  },
  updateProfile(request: SaveProfileRequest): Promise<MeProfile> {
    const body: c.UpdateProfileRequest = { firstName: request.firstName, lastName: request.lastName, phoneNumber: request.phoneNumber };
    return call<c.ProfileResponse>({ path: '/me/profile', method: 'PUT', body }).then(m.toMeProfile);
  },
};

/* ------------------------------ reception -------------------------------- */

export const realReceptionApi = {
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>> {
    return call<c.Paged<c.BookingListItemResponse>>({ path: `/reception/bookings${buildQuery(bookingQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toBookingListItem),
    );
  },
  getBooking(id: string): Promise<BookingResponse> {
    return fetchReceptionBooking(id);
  },
  createBooking(request: ReceptionCreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    const body: c.ReceptionCreateBookingRequest = {
      checkInDate: request.checkInDate,
      checkInTime: request.checkInTime ?? null,
      checkOutDate: request.checkOutDate,
      checkOutTime: request.checkOutTime ?? null,
      adults: request.adults,
      children: request.children,
      guest: {
        firstName: request.guest.firstName,
        lastName: request.guest.lastName,
        phoneNumber: request.guest.phoneNumber,
      },
      rooms: request.rooms.map((r) => ({ roomTypeId: r.roomTypeId, quantity: r.quantity })),
    };
    return call<c.CreateBookingResponse>({ path: '/reception/bookings', method: 'POST', body, idempotencyKey }).then((r) => m.toBooking(r.booking));
  },
  cancelBooking(id: string, request: ReceptionCancelBookingRequest): Promise<BookingResponse> {
    const body: c.ReceptionCancelBookingRequest = {
      reason: request.reason,
      notes: request.notes ?? null,
      refundPaidAmounts: request.refundPaidAmounts,
    };
    return call<c.BookingDetailResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/cancel`, method: 'POST', body }).then(m.toBooking);
  },
  assignRooms(id: string, request: AssignRoomsRequest): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/assign-rooms`, method: 'POST', body: request }).then(m.toBooking);
  },
  async checkIn(id: string): Promise<BookingResponse> {
    await call<c.CheckInResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/check-in`, method: 'POST' });
    return fetchReceptionBooking(id);
  },
  async checkOut(id: string, request?: CheckOutRequest): Promise<BookingResponse> {
    const body: c.CheckOutRequest | undefined = request ? { earlyCheckOut: request.earlyCheckOut ?? null } : undefined;
    await call<c.CheckOutResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/check-out`, method: 'POST', body });
    return fetchReceptionBooking(id);
  },
  async changeRoomType(id: string, request: ChangeRoomTypeRequest): Promise<ChangeRoomTypeResult> {
    const body: c.ChangeRoomTypeRequest = {
      bookingRoomTypeId: request.bookingRoomTypeId,
      newRoomTypeId: request.newRoomTypeId,
      quantity: request.quantity,
    };
    const resp = await call<c.ChangeRoomTypeResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/change-room-type`, method: 'POST', body });
    return { booking: m.toBooking(resp.booking), assignmentsCleared: resp.assignmentsCleared };
  },
  reassignRoom(id: string, request: ReassignRoomRequest): Promise<BookingResponse> {
    const body: c.ReassignRoomRequest = {
      roomAssignmentId: request.roomAssignmentId,
      newRoomId: request.newRoomId,
      reason: request.reason ?? null,
      acknowledgeLateAvailability: request.acknowledgeLateAvailability ?? false,
    };
    return call<c.BookingDetailResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/reassign-room`, method: 'POST', body }).then(m.toBooking);
  },
  unassignRoom(id: string, request: UnassignRoomRequest): Promise<BookingResponse> {
    const body: c.UnassignRoomRequest = { roomAssignmentId: request.roomAssignmentId };
    return call<c.BookingDetailResponse>({ path: `/reception/bookings/${encodeURIComponent(id)}/unassign-room`, method: 'POST', body }).then(m.toBooking);
  },
  listRooms(params: RoomListParams): Promise<Paginated<Room>> {
    return call<c.Paged<c.RoomListItemResponse>>({ path: `/reception/rooms${buildQuery(roomQuery(params))}` }).then(
      (p) => m.mapPage(p, m.toRoom),
    );
  },
  listGuests(params: PaginationParams): Promise<Paginated<GuestListItem>> {
    return call<c.Paged<c.GuestResponse>>({ path: `/reception/guests${buildQuery({ ...pagedQuery(params), search: params.search })}` }).then((p) =>
      m.mapPage(p, m.toGuest),
    );
  },
  listPayments(params: PaginationParams): Promise<Paginated<PaymentListItem>> {
    return call<c.Paged<c.PaymentListItemResponse>>({ path: `/reception/payments${buildQuery(pagedQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toPaymentListItem),
    );
  },
  recordPayment(request: RecordPaymentRequest): Promise<Payment> {
    const body: c.RecordPaymentRequest = {
      bookingId: request.bookingId,
      amount: request.amount,
      method: request.paymentMethod,
      reference: request.reference,
      notes: request.notes,
    };
    return call<c.PaymentResponse>({ path: '/reception/payments', method: 'POST', body }).then(m.toPayment);
  },
};

/* -------------------------------- admin ---------------------------------- */

export const realAdminApi = {
  async dashboard(): Promise<AdminDashboard> {
    const [dashboard, report] = await Promise.all([
      call<c.DashboardResponse>({ path: '/admin/dashboard' }),
      call<c.ReportResponse>({ path: '/admin/reports' }).catch(() => undefined),
    ]);
    return m.toDashboard(dashboard, report);
  },
  listRooms(params: RoomListParams): Promise<Paginated<Room>> {
    return call<c.Paged<c.RoomListItemResponse>>({
      path: `/admin/rooms${buildQuery(roomQuery(params))}`,
    }).then((p) => m.mapPage(p, m.toRoom));
  },
  createRoom(request: SaveRoomRequest): Promise<Room> {
    const body: c.CreateRoomRequest = { roomNumber: request.roomNumber, roomTypeId: request.roomTypeId, floor: String(request.floor) };
    return call<c.RoomResponse>({ path: '/admin/rooms', method: 'POST', body }).then(m.toRoom);
  },
  getRoom(id: string): Promise<Room> {
    return call<c.RoomResponse>({ path: `/admin/rooms/${encodeURIComponent(id)}` }).then(m.toRoom);
  },
  updateRoom(id: string, request: SaveRoomRequest): Promise<Room> {
    const body: c.UpdateRoomRequest = { roomNumber: request.roomNumber, roomTypeId: request.roomTypeId, floor: String(request.floor) };
    return call<c.RoomResponse>({ path: `/admin/rooms/${encodeURIComponent(id)}`, method: 'PUT', body }).then(m.toRoom);
  },
  updateRoomStatus(id: string, status: Room['status']): Promise<Room> {
    return call<c.RoomResponse>({ path: `/admin/rooms/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { status } }).then(m.toRoom);
  },
  async listRoomTypes(params: PaginationParams): Promise<Paginated<RoomTypeResponse>> {
    const set = await loadRoomTypes('/admin/room-types', false, true);
    return {
      items: set.list,
      page: params.page ?? set.page.page,
      pageSize: params.pageSize ?? set.page.pageSize,
      totalCount: set.page.totalCount,
      totalPages: set.page.totalPages,
    };
  },
  createRoomType(request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    return call<c.RoomTypeResponse>({ path: '/admin/room-types', method: 'POST', body: request }).then(m.toRoomType);
  },
  getRoomType(id: string): Promise<RoomTypeResponse> {
    return call<c.RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}` }).then(m.toRoomType);
  },
  updateRoomType(id: string, request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    // Send every field the form owns, including empty image/feature arrays, so that
    // removing the last image (or feature) actually clears it server-side. The admin
    // detail endpoint now returns inactive types, so nothing is blanked accidentally.
    const body: c.SaveRoomTypeRequest = {
      name: request.name,
      description: request.description,
      basePrice: request.basePrice,
      maximumOccupancy: request.maximumOccupancy,
      bedType: request.bedType,
      imageUrls: request.imageUrls,
      features: request.features,
    };
    return call<c.RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}`, method: 'PUT', body }).then(m.toRoomType);
  },
  updateRoomTypeStatus(id: string, isActive: boolean): Promise<RoomTypeResponse> {
    return call<c.RoomTypeResponse>({ path: `/admin/room-types/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { isActive } }).then(m.toRoomType);
  },
  listBookings(params: BookingFilterParams): Promise<Paginated<BookingListItem>> {
    return call<c.Paged<c.BookingListItemResponse>>({ path: `/admin/bookings${buildQuery(bookingQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toBookingListItem),
    );
  },
  restoreBooking(id: string): Promise<BookingResponse> {
    return call<c.BookingDetailResponse>({ path: `/admin/bookings/${encodeURIComponent(id)}/restore`, method: 'POST' }).then(m.toBooking);
  },
  listGuests(params: PaginationParams): Promise<Paginated<GuestListItem>> {
    return call<c.Paged<c.GuestResponse>>({
      path: `/admin/guests${buildQuery({ ...pagedQuery(params), search: params.search, from: undefined, to: undefined })}`,
    }).then((p) => m.mapPage(p, m.toGuest));
  },
  listUsers(params: UserListParams): Promise<Paginated<UserListItem>> {
    return call<c.Paged<c.UserListItemResponse>>({
      path: `/admin/users${buildQuery({ ...pagedQuery(params), search: params.search, role: params.role })}`,
    }).then((p) => m.mapPage(p, m.toUserListItem));
  },
  changeUserRole(id: string, request: ChangeUserRoleRequest): Promise<UserListItem> {
    const body: c.ChangeUserRoleRequest = { role: request.role };
    return call<c.UserListItemResponse>({ path: `/admin/users/${encodeURIComponent(id)}/role`, method: 'PATCH', body }).then(m.toUserListItem);
  },
  listStaff(params: PaginationParams & { isActive?: boolean; role?: string }): Promise<Paginated<Staff>> {
    return call<c.Paged<c.StaffResponse>>({
      path: `/admin/staff${buildQuery({ ...pagedQuery(params), isActive: params.isActive, role: params.role })}`,
    }).then((p) => m.mapPage(p, m.toStaff));
  },
  createStaff(request: SaveStaffRequest): Promise<Staff> {
    const body: c.CreateStaffRequest = {
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      password: request.password ?? '',
      role: request.role,
      phoneNumber: request.phoneNumber,
    };
    return call<c.StaffResponse>({ path: '/admin/staff', method: 'POST', body }).then(m.toStaff);
  },
  updateStaffStatus(id: string, isActive: boolean): Promise<Staff> {
    return call<c.StaffResponse>({ path: `/admin/staff/${encodeURIComponent(id)}/status`, method: 'PATCH', body: { isActive } }).then(m.toStaff);
  },
  listPayments(params: PaginationParams): Promise<Paginated<PaymentListItem>> {
    return call<c.Paged<c.PaymentListItemResponse>>({ path: `/admin/payments${buildQuery(pagedQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toPaymentListItem),
    );
  },
  reports(): Promise<AdminReports> {
    return call<c.ReportResponse>({ path: '/admin/reports' }).then(m.toReports);
  },
  listActivityLogs(params: PaginationParams): Promise<Paginated<ActivityLog>> {
    return call<c.Paged<c.ActivityLogResponse>>({ path: `/admin/activity-logs${buildQuery(pagedQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toActivityLog),
    );
  },
  listNotifications(params: PaginationParams): Promise<Paginated<AppNotification>> {
    return call<c.Paged<c.NotificationResponse>>({ path: `/admin/notifications${buildQuery(pagedQuery(params))}` }).then((p) =>
      m.mapPage(p, m.toNotification),
    );
  },
  getSettings(): Promise<HotelSettings> {
    return call<c.AdminSettingsResponse>({ path: '/admin/settings' }).then(m.toSettings);
  },
  updateSettings(request: SaveSettingsRequest): Promise<HotelSettings> {
    return call<c.AdminSettingsResponse>({ path: '/admin/settings', method: 'PUT', body: m.toSettingsPatch(request) }).then(m.toSettings);
  },
};

export const realServices = {
  auth: realAuthApi,
  roomTypes: realRoomTypesApi,
  availability: realAvailabilityApi,
  stay: realStayApi,
  pricing: realPricingApi,
  uploads: realUploadsApi,
  bookings: realBookingsApi,
  me: realMeApi,
  reception: realReceptionApi,
  admin: realAdminApi,
  contact: realContactApi,
};
