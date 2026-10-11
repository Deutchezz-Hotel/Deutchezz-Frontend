/**
 * Pure mock domain rules.
 *
 * These functions mirror the real backend's behaviour and are deliberately kept
 * free of localStorage/latency so they can be unit tested directly. The mock
 * service adapters compose these rules with persistence and simulated latency.
 */
import { parseISO } from 'date-fns';
import { ApiError } from '@/api/problem';
import { appConfig } from '@/config/appConfig';
import { nightsBetween } from '@/lib/dates';
import type {
  AvailabilityResponse,
  AvailableRoomTypeResponse,
  BookingListItem,
  BookingResponse,
  BookingStatus,
  CreateBookingRequest,
  RoomTypeResponse,
} from '@/types';

export type RoomTypeLike = Pick<RoomTypeResponse, 'id' | 'name' | 'description' | 'basePrice' | 'maximumOccupancy' | 'bedType' | 'imageUrls' | 'features' | 'isActive'>;
export type RoomLike = { roomTypeId: string; status: string };
export type BookingLike = Pick<BookingResponse, 'id' | 'bookingReference' | 'status' | 'paymentStatus' | 'checkInDate' | 'checkOutDate' | 'adults' | 'children' | 'guest' | 'rooms' | 'totalAmount' | 'createdAt' | 'updatedAt' | 'nights'>;

export const BOOKING_STATUSES_THAT_BLOCK: BookingStatus[] = ['Pending', 'Confirmed', 'CheckedIn'];

/**
 * Re-derive every line (per-night rate, nights, subtotal) and the booking total
 * from the room-type catalogue. This is the single source of truth: numbers are
 * never typed in by hand anywhere in the UI.
 */
export function deriveBookingTotals(bookings: BookingLike[], roomTypes: RoomTypeLike[]): void {
  for (const b of bookings) {
    const nights = nightsBetween(b.checkInDate, b.checkOutDate);
    let total = 0;
    for (const line of b.rooms) {
      const rate = roomTypes.find((t) => t.id === line.roomTypeId)?.basePrice ?? line.ratePerNight ?? 0;
      line.ratePerNight = rate;
      line.numberOfNights = nights;
      line.subtotal = rate * line.quantity * nights;
      total += line.subtotal;
    }
    b.nights = nights;
    b.totalAmount = total;
  }
}

/** Half-open interval overlap: a checkout on date X does not block a check-in on date X. */
export function overlapsHalfOpen(checkInA: string, checkOutA: string, checkInB: string, checkOutB: string): boolean {
  return checkInA < checkOutB && checkInB < checkOutA;
}

/** Rooms of a type that are active (not Maintenance or Inactive). */
export function capacityFor(roomTypeId: string, rooms: RoomLike[]): number {
  return rooms.filter((r) => r.roomTypeId === roomTypeId && r.status !== 'Maintenance' && r.status !== 'Inactive').length;
}

/** Rooms of a type already committed for bookings overlapping the stay. */
export function bookedFor(roomTypeId: string, checkInDate: string, checkOutDate: string, bookings: BookingLike[]): number {
  let count = 0;
  for (const b of bookings) {
    if (!BOOKING_STATUSES_THAT_BLOCK.includes(b.status)) continue;
    if (!overlapsHalfOpen(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate)) continue;
    for (const line of b.rooms) {
      if (line.roomTypeId === roomTypeId) count += line.quantity;
    }
  }
  return count;
}

export function availableFor(roomTypeId: string, checkInDate: string, checkOutDate: string, rooms: RoomLike[], bookings: BookingLike[]): number {
  return capacityFor(roomTypeId, rooms) - bookedFor(roomTypeId, checkInDate, checkOutDate, bookings);
}

export function totalAvailableRooms(checkInDate: string, checkOutDate: string, roomTypes: RoomTypeLike[], rooms: RoomLike[], bookings: BookingLike[]): number {
  return roomTypes.reduce((sum, t) => sum + Math.max(0, availableFor(t.id, checkInDate, checkOutDate, rooms, bookings)), 0);
}

export function searchAvailability(
  checkInDate: string,
  checkOutDate: string,
  roomTypes: RoomTypeLike[],
  rooms: RoomLike[],
  bookings: BookingLike[],
): AvailabilityResponse {
  const nights = nightsBetween(checkInDate, checkOutDate);
  const streaming: AvailableRoomTypeResponse[] = roomTypes
    .filter((t) => t.isActive)
    .map((t) => {
      const availableRooms = availableFor(t.id, checkInDate, checkOutDate, rooms, bookings);
      return {
        roomTypeId: t.id,
        name: t.name,
        description: t.description,
        bedType: t.bedType,
        maximumOccupancy: t.maximumOccupancy,
        imageUrls: t.imageUrls,
        features: t.features,
        pricePerNight: t.basePrice,
        availableRooms: Math.max(0, availableRooms),
        subtotalPerRoom: t.basePrice * nights,
      };
    })
    .filter((t) => t.availableRooms > 0);

  return {
    checkInDate,
    checkOutDate,
    nights,
    totalAvailableRooms: streaming.reduce((sum, t) => sum + t.availableRooms, 0),
    roomTypes: streaming,
  };
}

export function referenceExists(reference: string, bookings: BookingLike[]): boolean {
  return bookings.some((b) => b.bookingReference === reference);
}

export function generateBookingReference(bookings: BookingLike[]): string {
  const year = new Date().getFullYear();
  for (let i = 0; i < 50; i++) {
    const code = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, '0');
    const reference = `DHI-${year}-${code}`;
    if (!referenceExists(reference, bookings)) return reference;
  }
  return `DHI-${year}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

export interface IdempotencyResult {
  booking: BookingResponse;
  replay: boolean;
}

/**
 * Idempotent booking creation.
 * Replaying the same key+payload returns the original booking; the same key
 * with a different payload is a conflict (409).
 */
export function createBookingFromData(
  request: CreateBookingRequest,
  idempotencyKey: string,
  roomTypes: RoomTypeLike[],
  rooms: RoomLike[],
  bookings: BookingLike[],
  idempotency: Record<string, { hash: string; bookingId: string }>,
): IdempotencyResult {
  const hash = JSON.stringify(request);
  const prior = idempotency[idempotencyKey];
  if (prior) {
    const original = bookings.find((b) => b.id === prior.bookingId);
    if (original && prior.hash === hash) {
      return { booking: original as BookingResponse, replay: true };
    }
    throw new ApiError({ status: 409, title: 'Conflict', detail: 'Idempotency-Key was already used with a different request' });
  }

  validateBookingRequest(request, roomTypes, rooms, bookings);

  const today = new Date().toISOString().slice(0, 10);
  const reference = generateBookingReference(bookings);
  const booking: BookingResponse = {
    id: `booking-${Date.now().toString(36)}`,
    bookingReference: reference,
    status: 'Confirmed',
    paymentStatus: 'Pending',
    checkInDate: request.checkInDate,
    checkOutDate: request.checkOutDate,
    nights: nightsBetween(request.checkInDate, request.checkOutDate),
    adults: request.adults,
    children: request.children,
    guest: { ...request.guest },
    rooms: request.rooms.map((line) => {
      const type = roomTypes.find((t) => t.id === line.roomTypeId);
      return {
        bookingRoomTypeId: `brt-${Math.random().toString(36).slice(2, 10)}`,
        roomTypeId: line.roomTypeId,
        roomTypeName: type?.name ?? line.roomTypeId,
        quantity: line.quantity,
        ratePerNight: type?.basePrice ?? 0,
        numberOfNights: nightsBetween(request.checkInDate, request.checkOutDate),
        subtotal: (type?.basePrice ?? 0) * line.quantity * nightsBetween(request.checkInDate, request.checkOutDate),
      };
    }),
    specialRequests: request.specialRequests ?? null,
    totalAmount: request.rooms.reduce(
      (sum, line) => sum + (roomTypes.find((t) => t.id === line.roomTypeId)?.basePrice ?? 0) * line.quantity * nightsBetween(request.checkInDate, request.checkOutDate),
      0,
    ),
    createdAt: today,
    updatedAt: today,
  };

  idempotency[idempotencyKey] = { hash, bookingId: booking.id };
  bookings.push(booking as unknown as BookingLike);
  return { booking, replay: false };
}

/** Throws a 400 ProblemDetails for invalid requests and a 409 for shortages. */
export function validateBookingRequest(
  request: CreateBookingRequest,
  roomTypes: RoomTypeLike[],
  rooms: RoomLike[],
  bookings: BookingLike[],
): void {
  const today = new Date().toISOString().slice(0, 10);
  const errors: Record<string, string[]> = {};

  if (!request.checkInDate || request.checkInDate < today) {
    errors.checkInDate = ['Check-in date cannot be in the past'];
  }
  if (!request.checkOutDate || request.checkOutDate <= request.checkInDate) {
    errors.checkOutDate = ['Check-out date must be after check-in'];
  }
  if (!request.rooms?.length) {
    errors.rooms = ['Select at least one room'];
  }
  const totalRooms = request.rooms?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
  if (totalRooms > appConfig.maxRoomsPerBooking) {
    errors.rooms = [`A maximum of ${appConfig.maxRoomsPerBooking} rooms can be booked at once`];
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError({ status: 400, title: 'Validation failed', detail: 'Some values are invalid', errors });
  }

  let shortType = '';
  for (const line of request.rooms) {
    const type = roomTypes.find((t) => t.id === line.roomTypeId);
    if (!type || !type.isActive) {
      errors.rooms = ['One of the selected room types is no longer available'];
      break;
    }
    const available = availableFor(line.roomTypeId, request.checkInDate, request.checkOutDate, rooms, bookings);
    if (line.quantity > available) {
      shortType = type.name;
      break;
    }
  }
  if (shortType) {
    throw new ApiError({
      status: 409,
      title: 'Rooms unavailable',
      detail: 'These rooms are no longer available for your dates',
      errors: { rooms: [`${shortType} only has fewer rooms left than requested`] },
    });
  }
  if (Object.keys(errors).length > 0) {
    throw new ApiError({ status: 400, title: 'Validation failed', detail: 'Some values are invalid', errors });
  }
}

export function roomsSummary(lines: BookingResponse['rooms']): string {
  return lines.map((l) => (l.quantity > 1 ? `${l.quantity} × ${l.roomTypeName}` : l.roomTypeName)).join(', ');
}

export function bookingListItem(b: BookingResponse): BookingListItem {
  return {
    id: b.id,
    bookingReference: b.bookingReference,
    status: b.status,
    paymentStatus: b.paymentStatus,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    nights: b.nights,
    guestName: `${b.guest.firstName} ${b.guest.lastName}`,
    guestEmail: b.guest.email,
    roomsCount: b.rooms.reduce((sum, r) => sum + r.quantity, 0),
    roomsSummary: roomsSummary(b.rooms),
    totalAmount: b.totalAmount,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function paginate<T>(items: T[], page = 1, pageSize = 10): { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number } {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}

export function searchText(items: Array<Record<string, string>>, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return items.some((record) => Object.values(record).some((value) => value.toLowerCase().includes(q)));
}

/** 429 guard: more than 5 attempts inside a 60s window is rate-limited. */
export function rateLimitSeconds(attempts: number[]): number | null {
  const now = Date.now();
  const recent = attempts.filter((t) => now - t < 60_000);
  if (recent.length >= 5) {
    return Math.max(1, Math.ceil(60 - (now - recent[0]) / 1000));
  }
  return null;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toIsoDate(d);
}

export function isDateInPast(dateStr: string): boolean {
  return parseISO(dateStr).getTime() < new Date(new Date().toISOString().slice(0, 10)).getTime();
}