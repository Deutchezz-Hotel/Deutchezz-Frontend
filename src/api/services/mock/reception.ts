import { ApiError } from '@/api/problem';
import type {
  AssignRoomsRequest,
  BookingListItem,
  BookingResponse,
  CreateBookingRequest,
  GuestListItem,
  Paginated,
  Payment,
  RecordPaymentRequest,
  Room,
} from '@/types';
import { readDb, writeDb, type MockDbData } from './db';
import { simulateLatency } from './latency';
import { createBookingFromData, paginate } from './rules';
import { deriveGuests, filterBookings } from './selectors';
import { requireRole } from './session';

const RECEPTION_ROLES = ['Receptionist', 'Administrator'] as const;

function appendActivity(db: MockDbData, type: string, message: string, actorName: string) {
  db.activityLogs.unshift({
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    type: type as never,
    message,
    actorName,
    timestamp: new Date().toISOString().slice(0, 10),
  });
}

function appendNotification(db: MockDbData, type: 'CheckInCompleted' | 'CheckOutCompleted' | 'PaymentReceived', message: string) {
  db.notifications.unshift({
    id: `notif-${Math.random().toString(36).slice(2, 9)}`,
    type,
    message,
    isRead: false,
    createdAt: new Date().toISOString().slice(0, 10),
  });
}



function recomputePaymentStatus(db: MockDbData, booking: BookingResponse): void {
  const paid = db.payments.filter((p) => p.bookingId === booking.id).reduce((sum, p) => sum + p.amount, 0);
  if (paid <= 0) booking.paymentStatus = 'Pending';
  else if (paid >= booking.totalAmount) booking.paymentStatus = 'Paid';
  else booking.paymentStatus = 'PartiallyPaid';
}

export const mockReceptionApi = {
  async listBookings(params: { page?: number; pageSize?: number; status?: string; dateFrom?: string; dateTo?: string; search?: string }): Promise<Paginated<BookingListItem>> {
    await simulateLatency();
    const db = readDb();
    requireRole([...RECEPTION_ROLES], db);
    return paginate(filterBookings(db, params), params.page, params.pageSize);
  },

  async getBooking(id: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    requireRole([...RECEPTION_ROLES], db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    return booking;
  },

  async createBooking(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole([...RECEPTION_ROLES], db);
    const result = createBookingFromData(request, idempotencyKey, db.roomTypes, db.rooms, db.bookings, db.idempotency);
    if (!result.replay) {
      appendActivity(db, 'BookingCreated', `Walk-in booking ${result.booking.bookingReference} created at the front desk`, `${actor.firstName} ${actor.lastName}`);
      appendNotification(db, 'CheckInCompleted', `Walk-in booking ${result.booking.bookingReference} created`);
    }
    writeDb(db);
    return result.booking;
  },

  async assignRooms(id: string, request: AssignRoomsRequest): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole([...RECEPTION_ROLES], db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    if (booking.status !== 'Confirmed' && booking.status !== 'Pending') {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'Rooms can only be assigned before check-in' });
    }
    for (const assignment of request.assignments) {
      const line = booking.rooms.find((r) => r.bookingRoomTypeId === assignment.bookingRoomTypeId);
      if (!line) throw new ApiError({ status: 400, title: 'Invalid assignment', detail: 'That room line does not belong to this booking' });
      const room = db.rooms.find((r) => r.id === assignment.roomId);
      if (!room) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room not found' });
      if (room.roomTypeId !== line.roomTypeId) {
        throw new ApiError({ status: 400, title: 'Invalid assignment', detail: `${room.roomNumber} does not match ${line.roomTypeName}` });
      }
      if (room.status !== 'Available') {
        throw new ApiError({ status: 409, title: 'Conflict', detail: `Room ${room.roomNumber} is not available` });
      }
      room.status = 'Occupied';
      line.assignedRoomNumbers = [...(line.assignedRoomNumbers ?? []), room.roomNumber];
    }
    appendActivity(db, 'BookedRoomsAssigned', `Rooms assigned to booking ${booking.bookingReference}`, `${actor.firstName} ${actor.lastName}`);
    writeDb(db);
    return booking;
  },

  async checkIn(id: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole([...RECEPTION_ROLES], db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    if (booking.status !== 'Confirmed' && booking.status !== 'Pending') {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'Only confirmed bookings can be checked in' });
    }
    const unassigned = booking.rooms.some((r) => !r.assignedRoomNumbers || r.assignedRoomNumbers.length < r.quantity);
    if (unassigned) {
      throw new ApiError({ status: 400, title: 'Rooms required', detail: 'Assign rooms before checking in' });
    }
    booking.status = 'CheckedIn';
    appendActivity(db, 'BookingCheckedIn', `${booking.guest.firstName} ${booking.guest.lastName} checked in (${booking.bookingReference})`, `${actor.firstName} ${actor.lastName}`);
    appendNotification(db, 'CheckInCompleted', `Check-in completed for ${booking.bookingReference}`);
    writeDb(db);
    return booking;
  },

  async checkOut(id: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole([...RECEPTION_ROLES], db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    if (booking.status !== 'CheckedIn') {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'Only checked-in bookings can be checked out' });
    }
    booking.status = 'CheckedOut';
    for (const roomNumber of booking.rooms.flatMap((r) => r.assignedRoomNumbers ?? [])) {
      const room = db.rooms.find((r) => r.roomNumber === roomNumber);
      if (room) room.status = 'Available';
    }
    recomputePaymentStatus(db, booking);
    appendActivity(db, 'BookingCheckedOut', `${booking.guest.firstName} ${booking.guest.lastName} checked out (${booking.bookingReference})`, `${actor.firstName} ${actor.lastName}`);
    appendNotification(db, 'CheckOutCompleted', `Check-out completed for ${booking.bookingReference}`);
    writeDb(db);
    return booking;
  },

  async listRooms(params: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<Paginated<Room>> {
    await simulateLatency();
    const db = readDb();
    requireRole([...RECEPTION_ROLES], db);
    let rooms = db.rooms.slice();
    if (params.status && params.status !== 'All') rooms = rooms.filter((r) => r.status === params.status);
    const q = params.search?.trim().toLowerCase();
    if (q) rooms = rooms.filter((r) => r.roomNumber.toLowerCase().includes(q) || r.roomTypeName.toLowerCase().includes(q));
    return paginate(rooms, params.page, params.pageSize ?? 100);
  },

  async listGuests(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<GuestListItem>> {
    await simulateLatency();
    const db = readDb();
    requireRole([...RECEPTION_ROLES], db);
    let guests = deriveGuests(db);
    const q = params.search?.trim().toLowerCase();
    if (q) guests = guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || g.email.toLowerCase().includes(q));
    return paginate(guests, params.page, params.pageSize);
  },

  async listPayments(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<Payment>> {
    await simulateLatency();
    const db = readDb();
    requireRole([...RECEPTION_ROLES], db);
    let payments = db.payments.slice().sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
    const q = params.search?.trim().toLowerCase();
    if (q) payments = payments.filter((p) => p.bookingReference.toLowerCase().includes(q));
    return paginate(payments, params.page, params.pageSize);
  },

  async recordPayment(request: RecordPaymentRequest): Promise<Payment> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole([...RECEPTION_ROLES], db);
    if (!['Cash', 'POS', 'BankTransfer'].includes(request.paymentMethod)) {
      throw new ApiError({ status: 400, title: 'Invalid payment method', detail: 'Payments can be recorded as Cash, POS or Bank transfer', errors: { paymentMethod: ['Choose Cash, POS or Bank transfer'] } });
    }
    if (!request.amount || request.amount <= 0) {
      throw new ApiError({ status: 400, title: 'Invalid amount', detail: 'Enter an amount greater than zero', errors: { amount: ['Enter an amount greater than zero'] } });
    }
    const booking = db.bookings.find((b) => b.id === request.bookingId);
    if (!booking) throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });

    const payment: Payment = {
      id: `pay-${Math.random().toString(36).slice(2, 9)}`,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      reference: request.reference ?? null,
      notes: request.notes ?? null,
      recordedAt: new Date().toISOString().slice(0, 10),
    };
    db.payments.unshift(payment);
    recomputePaymentStatus(db, booking);
    appendActivity(db, 'PaymentRecorded', `Payment of ₦${request.amount.toLocaleString('en-NG')} recorded for ${booking.bookingReference}`, `${actor.firstName} ${actor.lastName}`);
    appendNotification(db, 'PaymentReceived', `Payment received for ${booking.bookingReference}`);
    writeDb(db);
    return payment;
  },
};