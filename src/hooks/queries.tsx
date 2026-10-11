import { authStorage, services } from '@/api';
import type { BookingFilterParams, PaginationParams, RoomListParams } from '@/api';
import type {
  AnonymousCancelBookingRequest,
  AvailabilitySearchRequest,
  BookingLookupRequest,
  CreateBookingRequest,
  LoginRequest,
  RegisterRequest,
  SaveProfileRequest,
  SaveRoomRequest,
  SaveRoomTypeRequest,
  SaveStaffRequest,
  SaveSettingsRequest,
  RoomStatus,
  RecordPaymentRequest,
  AssignRoomsRequest,
  CancelBookingRequest,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const keys = {
  roomTypes: ['room-types'] as const,
  availability: (q: AvailabilitySearchRequest) => ['availability', q] as const,
  meBookings: (params: BookingFilterParams) => ['me', 'bookings', params] as const,
  meBooking: (id: string) => ['me', 'bookings', id] as const,
  meProfile: ['me', 'profile'] as const,
  receptionBookings: (params: BookingFilterParams) => ['reception', 'bookings', params] as const,
  receptionBooking: (id: string) => ['reception', 'bookings', id] as const,
  receptionRooms: (params: RoomListParams) => ['reception', 'rooms', params] as const,
  receptionGuests: (params: PaginationParams) => ['reception', 'guests', params] as const,
  receptionPayments: (params: PaginationParams) => ['reception', 'payments', params] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminRooms: (params: RoomListParams) => ['admin', 'rooms', params] as const,
  adminRoomTypes: (params: PaginationParams) => ['admin', 'room-types', params] as const,
  adminBookings: (params: BookingFilterParams) => ['admin', 'bookings', params] as const,
  adminGuests: (params: PaginationParams) => ['admin', 'guests', params] as const,
  adminStaff: (params: PaginationParams) => ['admin', 'staff', params] as const,
  adminPayments: (params: PaginationParams) => ['admin', 'payments', params] as const,
  adminReports: ['admin', 'reports'] as const,
  adminActivity: (params: PaginationParams) => ['admin', 'activity', params] as const,
  adminNotifications: (params: PaginationParams) => ['admin', 'notifications', params] as const,
  adminSettings: ['admin', 'settings'] as const,
};

/* ------------------------------- Public ---------------------------------- */

export function usePublicRoomTypes() {
  return useQuery({ queryKey: keys.roomTypes, queryFn: services.roomTypes.list });
}

export function usePublicRoomType(id: string | undefined) {
  return useQuery({
    queryKey: ['room-types', id],
    queryFn: () => services.roomTypes.get(id!),
    enabled: !!id,
  });
}

export function useAvailability(query: AvailabilitySearchRequest, enabled = true) {
  return useQuery({ queryKey: keys.availability(query), queryFn: () => services.availability.search(query), enabled });
}

export function useCreateBooking(idempotencyKey: string | null) {
  return useMutation({
    mutationFn: ({ request }: { request: CreateBookingRequest }) => {
      if (!idempotencyKey) throw new Error('idempotencyKey missing');
      return services.bookings.create(request, idempotencyKey);
    },
  });
}

export function useBookingLookup() {
  return useMutation({ mutationFn: (request: BookingLookupRequest) => services.bookings.lookup(request) });
}

export function useAnonymousCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: AnonymousCancelBookingRequest) => services.bookings.cancel(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/* -------------------------------- Auth ----------------------------------- */

export function useLogin() {
  return useMutation({
    mutationFn: (request: LoginRequest) => services.auth.login(request),
    onSuccess: (data) => {
      authStorage.setAccessToken(data.accessToken);
      authStorage.setRefreshToken(data.refreshToken);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (request: RegisterRequest) => services.auth.register(request),
    onSuccess: (data) => {
      authStorage.setAccessToken(data.accessToken);
      authStorage.setRefreshToken(data.refreshToken);
    },
  });
}

/* ------------------------------ Customer --------------------------------- */

export function useMeBookings(params: BookingFilterParams) {
  return useQuery({ queryKey: keys.meBookings(params), queryFn: () => services.me.listBookings(params) });
}

export function useMeBooking(id: string | undefined) {
  return useQuery({ queryKey: keys.meBooking(id!), queryFn: () => services.me.getBooking(id!), enabled: !!id });
}

export function useCancelMeBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CancelBookingRequest }) => services.me.cancelBooking(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useMeProfile() {
  return useQuery({ queryKey: keys.meProfile, queryFn: services.me.getProfile });
}

export function useUpdateMeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveProfileRequest) => services.me.updateProfile(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.meProfile }),
  });
}

/* ------------------------------ Reception -------------------------------- */

export function useReceptionBookings(params: BookingFilterParams) {
  return useQuery({ queryKey: keys.receptionBookings(params), queryFn: () => services.reception.listBookings(params) });
}

export function useReceptionBooking(id: string | undefined) {
  return useQuery({ queryKey: keys.receptionBooking(id!), queryFn: () => services.reception.getBooking(id!), enabled: !!id });
}

export function useReceptionCreateBooking(idempotencyKey: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBookingRequest) => services.reception.createBooking(request, idempotencyKey ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useReceptionAction() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['reception'] });
    qc.invalidateQueries({ queryKey: ['admin'] });
  };
  return {
    assignRooms: useMutation({
      mutationFn: ({ id, request }: { id: string; request: AssignRoomsRequest }) => services.reception.assignRooms(id, request),
      onSuccess: invalidate,
    }),
    checkIn: useMutation({
      mutationFn: (id: string) => services.reception.checkIn(id),
      onSuccess: invalidate,
    }),
    checkOut: useMutation({
      mutationFn: (id: string) => services.reception.checkOut(id),
      onSuccess: invalidate,
    }),
  };
}

export function useReceptionRooms(params: RoomListParams) {
  return useQuery({ queryKey: keys.receptionRooms(params), queryFn: () => services.reception.listRooms(params) });
}

export function useReceptionGuests(params: PaginationParams) {
  return useQuery({ queryKey: keys.receptionGuests(params), queryFn: () => services.reception.listGuests(params) });
}

export function useReceptionPayments(params: PaginationParams) {
  return useQuery({ queryKey: keys.receptionPayments(params), queryFn: () => services.reception.listPayments(params) });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: RecordPaymentRequest) => services.reception.recordPayment(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/* -------------------------------- Admin ---------------------------------- */

export function useAdminDashboard() {
  return useQuery({ queryKey: keys.adminDashboard, queryFn: services.admin.dashboard });
}

export function useAdminRooms(params: RoomListParams) {
  return useQuery({ queryKey: keys.adminRooms(params), queryFn: () => services.admin.listRooms(params) });
}

export function useAdminRoomMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['reception'] });
  };
  return {
    createRoom: useMutation({ mutationFn: (request: SaveRoomRequest) => services.admin.createRoom(request), onSuccess: invalidate }),
    updateRoom: useMutation({ mutationFn: ({ id, request }: { id: string; request: SaveRoomRequest }) => services.admin.updateRoom(id, request), onSuccess: invalidate }),
    updateRoomStatus: useMutation({ mutationFn: ({ id, status }: { id: string; status: RoomStatus }) => services.admin.updateRoomStatus(id, status), onSuccess: invalidate }),
  };
}

export function useAdminRoomTypes(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminRoomTypes(params), queryFn: () => services.admin.listRoomTypes(params) });
}

export function useAdminRoomTypeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['room-types'] });
  };
  return {
    createRoomType: useMutation({ mutationFn: (request: SaveRoomTypeRequest) => services.admin.createRoomType(request), onSuccess: invalidate }),
    updateRoomType: useMutation({ mutationFn: ({ id, request }: { id: string; request: SaveRoomTypeRequest }) => services.admin.updateRoomType(id, request), onSuccess: invalidate }),
    updateRoomTypeStatus: useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => services.admin.updateRoomTypeStatus(id, isActive), onSuccess: invalidate }),
  };
}

export function useAdminBookings(params: BookingFilterParams) {
  return useQuery({ queryKey: keys.adminBookings(params), queryFn: () => services.admin.listBookings(params) });
}

export function useAdminGuests(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminGuests(params), queryFn: () => services.admin.listGuests(params) });
}

export function useAdminStaff(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminStaff(params), queryFn: () => services.admin.listStaff(params) });
}

export function useAdminStaffMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
  return {
    createStaff: useMutation({ mutationFn: (request: SaveStaffRequest) => services.admin.createStaff(request), onSuccess: invalidate }),
    updateStaff: useMutation({ mutationFn: ({ id, request }: { id: string; request: SaveStaffRequest }) => services.admin.updateStaff(id, request), onSuccess: invalidate }),
    updateStaffStatus: useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => services.admin.updateStaffStatus(id, isActive), onSuccess: invalidate }),
  };
}

export function useAdminPayments(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminPayments(params), queryFn: () => services.admin.listPayments(params) });
}

export function useAdminReports() {
  return useQuery({ queryKey: keys.adminReports, queryFn: services.admin.reports });
}

export function useAdminActivity(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminActivity(params), queryFn: () => services.admin.listActivityLogs(params) });
}

export function useAdminNotifications(params: PaginationParams) {
  return useQuery({ queryKey: keys.adminNotifications(params), queryFn: () => services.admin.listNotifications(params) });
}

export function useAdminSettings() {
  return useQuery({ queryKey: keys.adminSettings, queryFn: services.admin.getSettings });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveSettingsRequest) => services.admin.updateSettings(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminSettings }),
  });
}
