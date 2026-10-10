import { ApiError } from '@/api/problem';
import type { BookingLookupRequest, BookingResponse, CreateBookingRequest } from '@/types';
import { readDb, writeDb } from './db';
import { simulateLatency } from './latency';
import { createBookingFromData, rateLimitSeconds } from './rules';

const GENERIC_LOOKUP_ERROR = "We couldn't find a booking with those details";

function pushActivity(db: ReturnType<typeof readDb>, message: string, actor = 'System', type: string) {
  db.activityLogs.unshift({
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    type: type as never,
    message,
    actorName: actor,
    timestamp: new Date().toISOString().slice(0, 10),
  });
}

export const mockBookingsApi = {
  async create(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const result = createBookingFromData(request, idempotencyKey, db.roomTypes, db.rooms, db.bookings, db.idempotency);
    if (!result.replay) {
      const b = result.booking;
      db.notifications.unshift({
        id: `notif-${Math.random().toString(36).slice(2, 9)}`,
        type: 'BookingConfirmed',
        message: `Booking ${b.bookingReference} has been confirmed`,
        isRead: false,
        createdAt: b.createdAt,
      });
      pushActivity(db, `Booking ${b.bookingReference} created for ${b.guest.firstName} ${b.guest.lastName}`, 'System', 'BookingCreated');
    }
    writeDb(db);
    return result.booking;
  },

  async lookup(request: BookingLookupRequest): Promise<BookingResponse> {
    await simulateLatency();

    const db = readDb();
    const now = Date.now();
    db.lookupAttempts = [...db.lookupAttempts.filter((t) => now - t < 60_000), now];
    const retryAfter = rateLimitSeconds(db.lookupAttempts.slice(0, -1));
    if (retryAfter !== null) {
      writeDb(db);
      throw new ApiError({ status: 429, title: 'Too many requests', detail: 'Too many attempts, please wait a moment' }, retryAfter);
    }
    writeDb(db);

    const reference = request.bookingReference.trim().toLowerCase();
    const email = request.email.trim().toLowerCase();
    const booking = db.bookings.find(
      (b) => b.bookingReference.toLowerCase() === reference && b.guest.email.toLowerCase() === email,
    );
    if (!booking) {
      throw new ApiError({ status: 404, title: 'Not found', detail: GENERIC_LOOKUP_ERROR });
    }
    return booking;
  },
};