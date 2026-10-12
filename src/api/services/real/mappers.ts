/**
 * Wire → view-model mappers.
 *
 * The backend contract and the UI's view models diverge in a handful of
 * places (richer UI shapes, different field names). Everything that talks to
 * the API goes through these functions so components only ever see `@/types`.
 */
import { initialsOf } from '@/lib/id';
import type {
  AdminDashboard,
  AdminReports,
  ActivityLog,
  AppNotification,
  AvailabilityResponse,
  BookingListItem,
  BookingResponse,
  BookingSource,
  GuestListItem,
  HotelSettings,
  MeProfile,
  NotificationType,
  Paginated,
  Payment,
  PaymentListItem,
  PaymentMethod,
  Room,
  RoomTypeResponse,
  Staff,
  User,
  UserListItem,
  UserRole,
} from '@/types';
import { appConfig } from '@/config/appConfig';
import * as c from './contracts';

/* ------------------------------- helpers --------------------------------- */

/** Split a display name into first/last (first token vs. remainder). */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const idx = trimmed.indexOf(' ');
  if (idx === -1) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, idx), lastName: trimmed.slice(idx + 1).trim() };
}

/** Whole nights between two yyyy-MM-dd dates (never negative). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00Z`).getTime();
  const b = new Date(`${checkOut}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Backend floor is a free-text string; the UI models it as a number. */
export function parseFloor(floor: string | null): number {
  if (!floor) return 0;
  const n = Number(floor);
  return Number.isFinite(n) ? n : 0;
}

/* --------------------------------- auth ---------------------------------- */

export function toUser(cu: c.CurrentUserResponse): User {
  return {
    id: cu.id,
    firstName: cu.firstName,
    lastName: cu.lastName,
    email: cu.email,
    role: cu.role as UserRole,
    initials: initialsOf(cu.firstName, cu.lastName),
  };
}

export function toMeProfile(p: c.ProfileResponse): MeProfile {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phoneNumber: p.phoneNumber ?? undefined,
  };
}

/* ------------------------------ room types ------------------------------- */

export function toRoomType(rt: c.RoomTypeResponse): RoomTypeResponse {
  return {
    id: rt.id,
    name: rt.name,
    description: rt.description ?? '',
    basePrice: rt.basePrice,
    maximumOccupancy: rt.maximumOccupancy,
    bedType: rt.bedType ?? '',
    imageUrls: rt.imageUrls ?? [],
    features: rt.features ?? [],
    isActive: rt.isActive,
  };
}

/**
 * Fallback for room types whose detail cannot be fetched. The backend's
 * GET /room-types/{id} only returns *active* types, so inactive entries in the
 * admin list have no detail endpoint; build what the list DTO provides.
 */
export function toRoomTypeFromList(rt: c.RoomTypeListItemResponse): RoomTypeResponse {
  return {
    id: rt.id,
    name: rt.name,
    description: '',
    basePrice: rt.basePrice,
    maximumOccupancy: rt.maximumOccupancy,
    bedType: rt.bedType ?? '',
    imageUrls: [],
    features: [],
    isActive: rt.isActive,
  };
}

/* ----------------------------- availability ------------------------------ */

export function toAvailability(
  resp: c.AvailabilityResponse,
  request: { checkInDate: string; checkOutDate: string },
  details: Map<string, RoomTypeResponse>,
): AvailabilityResponse {
  const nights = nightsBetween(request.checkInDate, request.checkOutDate);
  const roomTypes = resp.roomTypes.map((rt) => {
    const extra = details.get(rt.roomTypeId);
    return {
      roomTypeId: rt.roomTypeId,
      name: rt.name,
      description: extra?.description ?? '',
      bedType: extra?.bedType ?? '',
      maximumOccupancy: rt.maximumOccupancy,
      imageUrls: extra?.imageUrls ?? [],
      features: extra?.features ?? [],
      pricePerNight: rt.basePrice,
      availableRooms: rt.available,
      subtotalPerRoom: rt.basePrice * nights,
    };
  });
  return {
    checkInDate: resp.checkInDate,
    checkOutDate: resp.checkOutDate,
    nights,
    totalAvailableRooms: roomTypes.reduce((sum, rt) => sum + rt.availableRooms, 0),
    roomTypes,
  };
}

/* ------------------------------- bookings -------------------------------- */

export function toBooking(d: c.BookingDetailResponse): BookingResponse {
  const { firstName, lastName } = splitName(d.guestFullName);
  const liveRooms = d.assignments.filter((a) => a.releasedAt == null).map((a) => a.roomNumber);
  let cursor = 0;
  const rooms = d.lines.map((line) => {
    const assignedRoomNumbers = liveRooms.slice(cursor, cursor + line.quantity);
    cursor += line.quantity;
    return {
      bookingRoomTypeId: line.id,
      roomTypeId: line.roomTypeId,
      roomTypeName: line.roomTypeName,
      quantity: line.quantity,
      ratePerNight: line.ratePerNight,
      numberOfNights: line.numberOfNights,
      subtotal: line.subtotal,
      assignedRoomNumbers,
    };
  });
  return {
    id: d.id,
    bookingReference: d.bookingReference,
    status: d.status as BookingResponse['status'],
    paymentStatus: d.paymentStatus as BookingResponse['paymentStatus'],
    checkInDate: d.checkInDate,
    checkOutDate: d.checkOutDate,
    nights: d.nights,
    adults: d.adults,
    children: d.children,
    guest: { firstName, lastName, email: d.guestEmail, phoneNumber: d.guestPhoneNumber ?? '' },
    rooms,
    specialRequests: d.specialRequests,
    totalAmount: d.totalAmount,
    createdAt: d.createdAt,
    updatedAt: d.createdAt,
    source: d.source as BookingSource,
    createdByName: d.createdByName,
    payments: d.payments,
  };
}

export function toBookingListItem(item: c.BookingListItemResponse): BookingListItem {
  return {
    id: item.id,
    bookingReference: item.bookingReference,
    status: item.status as BookingListItem['status'],
    paymentStatus: item.paymentStatus as BookingListItem['paymentStatus'],
    checkInDate: item.checkInDate,
    checkOutDate: item.checkOutDate,
    nights: nightsBetween(item.checkInDate, item.checkOutDate),
    guestName: item.guestFullName,
    guestEmail: item.guestEmail,
    guestPhoneNumber: item.guestPhoneNumber ?? '',
    roomsCount: 0,
    roomsSummary: '',
    totalAmount: item.totalAmount,
    source: item.source as BookingSource,
    createdByName: item.createdByName,
    createdAt: item.checkInDate,
    updatedAt: item.checkOutDate,
  };
}

export function mapPage<TIn, TOut>(page: c.Paged<TIn>, map: (item: TIn) => TOut): Paginated<TOut> {
  return {
    items: page.items.map(map),
    page: page.page,
    pageSize: page.pageSize,
    totalCount: page.totalCount,
    totalPages: page.totalPages,
  };
}

/* --------------------------------- rooms --------------------------------- */

export function toRoom(r: c.RoomListItemResponse | c.RoomResponse): Room {
  return {
    id: r.id,
    roomNumber: r.roomNumber,
    floor: parseFloor(r.floor),
    roomTypeId: r.roomTypeId,
    roomTypeName: r.roomTypeName,
    status: r.status as Room['status'],
    effectiveStatus: (r.effectiveStatus ?? r.status) as Room['status'],
  };
}

/* -------------------------------- guests --------------------------------- */

export function toGuest(g: c.GuestResponse): GuestListItem {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phoneNumber: g.phoneNumber ?? '',
    initials: initialsOf(g.firstName, g.lastName),
    totalBookings: 0,
    inHouse: false,
    createdAt: g.createdAt,
  };
}

/* --------------------------------- staff --------------------------------- */

export function toStaff(s: c.StaffResponse): Staff {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phoneNumber: s.phoneNumber ?? undefined,
    role: s.role as Staff['role'],
    isActive: s.isActive,
    initials: initialsOf(s.firstName, s.lastName),
  };
}

/* -------------------------------- users ---------------------------------- */

export function toUserListItem(u: c.UserListItemResponse): UserListItem {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber ?? undefined,
    role: u.role as UserRole,
    isActive: u.isActive,
    emailConfirmed: u.emailConfirmed,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    bookingsCount: u.bookingsCount,
    initials: initialsOf(u.firstName, u.lastName),
  };
}

/* -------------------------------- payments ------------------------------- */
export function toPaymentListItem(p: c.PaymentListItemResponse): PaymentListItem {
  return {
    id: p.id,
    bookingId: p.bookingId,
    bookingReference: p.bookingReference || p.bookingId,
    guestName: p.guestName,
    payerName: '',
    amount: p.amount,
    paymentMethod: p.method as PaymentMethod,
    reference: p.reference,
    notes: null,
    recordedByName: '',
    paidAt: p.createdAt,
  };
}

export function toPayment(p: c.PaymentResponse): Payment {
  return {
    id: p.id,
    bookingId: p.bookingId,
    bookingReference: p.bookingId,
    guestName: '',
    payerName: '',
    amount: p.amount,
    paymentMethod: p.method as PaymentMethod,
    reference: p.reference,
    notes: p.notes,
    recordedByName: p.recordedByUserId ?? '',
    paidAt: p.createdAt,
  };
}

/* -------------------------------- reports -------------------------------- */

export function toDashboard(d: c.DashboardResponse, report?: c.ReportResponse): AdminDashboard {
  return {
    totalRooms: d.totalRooms,
    availableRooms: d.availableRooms,
    occupiedRooms: d.occupiedRooms,
    occupancyRate: d.occupancyPercentage,
    activeBookings: d.activeBookings,
    monthlyRevenue: d.revenueToday,
    totalRevenue: d.revenueToday,
    revenueTrend: report ? report.daily.map((day) => ({ date: day.date, revenue: day.revenue })) : [],
    bookingsByStatus: [],
    roomTypePerformance: [],
  };
}

export function toReports(r: c.ReportResponse): AdminReports {
  const adr = r.nightsBooked > 0 ? r.revenue / r.nightsBooked : 0;
  const revpar = r.roomNightsCapacity > 0 ? r.revenue / r.roomNightsCapacity : 0;
  const averageStayNights = r.bookingsCount > 0 ? r.nightsBooked / r.bookingsCount : 0;
  return {
    occupancyRate: r.occupancyRate,
    adr,
    revpar,
    totalRevenue: r.revenue,
    averageStayNights,
    revenueTrend: r.daily.map((day) => ({ date: day.date, revenue: day.revenue })),
    bookingsByStatus: [],
    bookingsByPaymentMethod: [],
  };
}

/* ----------------------------- activity logs ----------------------------- */

const ACTIVITY_TYPES: Record<string, ActivityLog['type']> = {
  'booking.created': 'BookingCreated',
  'booking.rooms_assigned': 'BookedRoomsAssigned',
  'booking.checked_in': 'BookingCheckedIn',
  'booking.checked_out': 'BookingCheckedOut',
  'booking.cancelled': 'BookingCancelled',
  'payment.recorded': 'PaymentRecorded',
  'room.status_changed': 'RoomStatusChanged',
  'roomtype.created': 'RoomTypeCreated',
  'roomtype.updated': 'RoomTypeUpdated',
  'staff.created': 'StaffCreated',
  'staff.updated': 'StaffUpdated',
};

export function toActivityLog(a: c.ActivityLogResponse): ActivityLog {
  return {
    id: a.id,
    type: ACTIVITY_TYPES[a.action] ?? a.action,
    message: a.description ?? a.action,
    actorName: a.userName ?? 'System',
    timestamp: a.createdAt,
  };
}

/* ------------------------------ notifications ---------------------------- */

export function toNotification(n: c.NotificationResponse): AppNotification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

/* -------------------------------- settings ------------------------------- */

export function toSettings(s: c.AdminSettingsResponse): HotelSettings {
  return {
    hotelName: appConfig.hotelName,
    addressLine1: '',
    addressLine2: '',
    phoneNumber: '',
    email: '',
    currency: 'NGN',
    checkInTime: s.checkInTime,
    checkOutTime: s.checkOutTime,
    maxRoomsPerBooking: s.maxRoomsPerBooking,
    cancellationWindowHours: s.cancellationWindowHours,
    requireFullPaymentAtCheckIn: s.requireFullPaymentAtCheckIn,
    requirePaymentBeforeCheckOut: s.requirePaymentBeforeCheckOut,
  };
}

/** Extract only the keys the backend accepts from a settings update. */
export function toSettingsPatch(request: Partial<HotelSettings>): c.UpdateAdminSettingsRequest {
  const patch: c.UpdateAdminSettingsRequest = {};
  if (request.maxRoomsPerBooking !== undefined) patch.maxRoomsPerBooking = request.maxRoomsPerBooking;
  if (request.checkInTime !== undefined) patch.checkInTime = request.checkInTime;
  if (request.checkOutTime !== undefined) patch.checkOutTime = request.checkOutTime;
  if (request.cancellationWindowHours !== undefined) patch.cancellationWindowHours = request.cancellationWindowHours;
  if (request.requireFullPaymentAtCheckIn !== undefined) patch.requireFullPaymentAtCheckIn = request.requireFullPaymentAtCheckIn;
  if (request.requirePaymentBeforeCheckOut !== undefined) patch.requirePaymentBeforeCheckOut = request.requirePaymentBeforeCheckOut;
  return patch;
}
