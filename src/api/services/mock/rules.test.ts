import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/problem';
import type { BookingRoomLine, CreateBookingRequest } from '@/types';
import {
  availableFor,
  createBookingFromData,
  daysFromToday,
  overlapsHalfOpen,
  type BookingLike,
  type RoomLike,
  type RoomTypeLike,
} from './rules';

function roomType(overrides: Partial<RoomTypeLike> & { id: string }): RoomTypeLike {
  return {
    name: 'Standard',
    description: '',
    basePrice: 50_000,
    maximumOccupancy: 2,
    bedType: 'Queen',
    imageUrls: [],
    features: [],
    isActive: true,
    ...overrides,
  };
}

function room(roomTypeId: string, status = 'Available'): RoomLike {
  return { roomTypeId, status };
}

function line(roomTypeId: string, quantity: number): BookingRoomLine {
  return {
    bookingRoomTypeId: `brt-${roomTypeId}`,
    roomTypeId,
    roomTypeName: 'Standard',
    quantity,
    ratePerNight: 50_000,
    numberOfNights: 2,
    subtotal: 50_000 * quantity * 2,
  };
}

function booking(overrides: Partial<BookingLike> = {}): BookingLike {
  return {
    id: 'existing-1',
    bookingReference: 'DHI-2026-AAAAAA',
    status: 'Confirmed',
    paymentStatus: 'Pending',
    checkInDate: '2026-11-01',
    checkOutDate: '2026-11-03',
    adults: 1,
    children: 0,
    guest: { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', phoneNumber: '08000000000' },
    rooms: [],
    totalAmount: 0,
    createdAt: '2026-10-01',
    nights: 2,
    ...overrides,
  };
}

function request(overrides: Partial<CreateBookingRequest> = {}): CreateBookingRequest {
  return {
    checkInDate: daysFromToday(1),
    checkOutDate: daysFromToday(3),
    adults: 2,
    children: 0,
    guest: { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', phoneNumber: '08000000000' },
    rooms: [{ roomTypeId: 'rt1', quantity: 1 }],
    specialRequests: null,
    ...overrides,
  };
}

describe('overlapsHalfOpen', () => {
  it('treats a back-to-back stay as non-overlapping', () => {
    expect(overlapsHalfOpen('2026-11-03', '2026-11-05', '2026-11-01', '2026-11-03')).toBe(false);
  });

  it('detects a genuine overlap', () => {
    expect(overlapsHalfOpen('2026-11-02', '2026-11-04', '2026-11-01', '2026-11-03')).toBe(true);
  });

  it('treats identical ranges as overlapping', () => {
    expect(overlapsHalfOpen('2026-11-01', '2026-11-03', '2026-11-01', '2026-11-03')).toBe(true);
  });
});

describe('availableFor', () => {
  it('subtracts blocking bookings from capacity', () => {
    const rooms = [room('rt1'), room('rt1'), room('rt1', 'Maintenance')];
    const bookings = [booking({ status: 'Confirmed', rooms: [line('rt1', 1)] })];
    expect(availableFor('rt1', '2026-11-01', '2026-11-03', rooms, bookings)).toBe(1);
  });

  it('ignores cancelled bookings', () => {
    const rooms = [room('rt1'), room('rt1')];
    const bookings = [booking({ status: 'Cancelled', rooms: [line('rt1', 2)] })];
    expect(availableFor('rt1', '2026-11-01', '2026-11-03', rooms, bookings)).toBe(2);
  });

  it('ignores non-overlapping stays', () => {
    const rooms = [room('rt1'), room('rt1')];
    const bookings = [booking({ checkInDate: '2026-12-01', checkOutDate: '2026-12-03', rooms: [line('rt1', 1)] })];
    expect(availableFor('rt1', '2026-11-01', '2026-11-03', rooms, bookings)).toBe(2);
  });
});

describe('createBookingFromData idempotency', () => {
  it('replays the original booking for the same key and payload', () => {
    const roomTypes = [roomType({ id: 'rt1' })];
    const rooms = [room('rt1')];
    const bookings: BookingLike[] = [];
    const idempotency: Record<string, { hash: string; bookingId: string }> = {};
    const req = request();

    const first = createBookingFromData(req, 'key-1', roomTypes, rooms, bookings, idempotency);
    const second = createBookingFromData(req, 'key-1', roomTypes, rooms, bookings, idempotency);

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(true);
    expect(second.booking.id).toBe(first.booking.id);
    expect(second.booking.bookingReference).toBe(first.booking.bookingReference);
    expect(bookings).toHaveLength(1);
  });

  it('rejects the same key reused with a different payload', () => {
    const roomTypes = [roomType({ id: 'rt1' })];
    const rooms = [room('rt1')];
    const bookings: BookingLike[] = [];
    const idempotency: Record<string, { hash: string; bookingId: string }> = {};

    createBookingFromData(request(), 'key-2', roomTypes, rooms, bookings, idempotency);

    expect(() =>
      createBookingFromData(request({ adults: 1 }), 'key-2', roomTypes, rooms, bookings, idempotency),
    ).toThrowError(ApiError);
    expect(bookings).toHaveLength(1);
  });

  it('rejects a booking for a room type without availability', () => {
    const roomTypes = [roomType({ id: 'rt1' })];
    const rooms: RoomLike[] = [];
    const bookings: BookingLike[] = [];
    const idempotency: Record<string, { hash: string; bookingId: string }> = {};

    expect(() => createBookingFromData(request(), 'key-3', roomTypes, rooms, bookings, idempotency)).toThrowError(ApiError);
    expect(bookings).toHaveLength(0);
  });
});
