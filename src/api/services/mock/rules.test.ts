import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/problem';
import type { BookingRoomLine, BookingResponse, CreateBookingRequest } from '@/types';
import {
  availableFor,
  createBookingFromData,
  daysFromToday,
  deriveBookingTotals,
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
    updatedAt: '2026-10-01',
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

describe('deriveBookingTotals — single source of truth', () => {
  it('recomputes subtotal and total from catalogue rates, quantities and nights', () => {
    const roomTypes: RoomTypeLike[] = [
      roomType({ id: 'rt-deluxe', name: 'Deluxe', basePrice: 40_000 }),
      roomType({ id: 'rt-executive', name: 'Executive', basePrice: 55_000 }),
    ];
    const existing: BookingLike = booking({
      checkInDate: '2026-11-01',
      checkOutDate: '2026-11-06',
      rooms: [
        line('rt-deluxe', 2),
        line('rt-executive', 1),
      ],
      totalAmount: 999_999,
    });

    deriveBookingTotals([existing], roomTypes);

    expect(existing.nights).toBe(5);
    const deluxe = existing.rooms[0];
    const executive = existing.rooms[1];
    expect(deluxe.ratePerNight).toBe(40_000);
    expect(deluxe.subtotal).toBe(40_000 * 2 * 5);
    expect(executive.ratePerNight).toBe(55_000);
    expect(executive.subtotal).toBe(55_000 * 1 * 5);
    expect(existing.totalAmount).toBe(2 * 40_000 * 5 + 55_000 * 5);
    expect(existing.totalAmount).toBe(675_000);
  });

  it('keeps a booking consistent with its expected example total', () => {
    const roomTypes: RoomTypeLike[] = [
      roomType({ id: 'rt-deluxe', name: 'Deluxe', basePrice: 40_000 }),
      roomType({ id: 'rt-executive', name: 'Executive', basePrice: 55_000 }),
    ];
    const b: BookingResponse = {
      id: 'b1',
      bookingReference: 'DHI-2026-TEST01',
      status: 'Confirmed',
      paymentStatus: 'Pending',
      checkInDate: '2026-11-01',
      checkOutDate: '2026-11-06',
      nights: 0,
      adults: 2,
      children: 1,
      guest: { firstName: 'Nnamdi', lastName: 'Eze', email: 'n@example.com', phoneNumber: '08000000000' },
      rooms: [
        { bookingRoomTypeId: 'l1', roomTypeId: 'rt-deluxe', roomTypeName: 'Deluxe Room', quantity: 2, ratePerNight: 0, numberOfNights: 0, subtotal: 0 },
        { bookingRoomTypeId: 'l2', roomTypeId: 'rt-executive', roomTypeName: 'Executive Room', quantity: 1, ratePerNight: 0, numberOfNights: 0, subtotal: 0 },
      ],
      specialRequests: null,
      totalAmount: 0,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    };

    deriveBookingTotals([b], roomTypes);

    expect(b.totalAmount).toBe(675_000);
    expect(b.nights).toBe(5);
    expect(b.rooms[0].subtotal).toBe(400_000);
    expect(b.rooms[1].subtotal).toBe(275_000);
  });
});
