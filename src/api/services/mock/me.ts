import { ApiError } from '@/api/problem';
import type { BookingListItem, BookingResponse, MeProfile, SaveProfileRequest } from '@/types';
import { readDb, writeDb } from './db';
import { simulateLatency } from './latency';
import { bookingListItem, paginate } from './rules';
import { requireMockUser } from './session';

function toProfile(user: { id: string; firstName: string; lastName: string; email: string; phoneNumber: string }): MeProfile {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phoneNumber: user.phoneNumber };
}

function ownsBooking(userEmail: string, booking: BookingResponse): boolean {
  return booking.guest.email.toLowerCase() === userEmail.toLowerCase();
}

export const mockMeApi = {
  async listBookings(params: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<import('@/types').Paginated<BookingListItem>> {
    await simulateLatency();
    const db = readDb();
    const user = requireMockUser(db);
    let items = db.bookings.filter((b) => ownsBooking(user.email, b));
    if (params.status && params.status !== 'All') {
      items = items.filter((b) => b.status === params.status);
    }
    const q = params.search?.trim().toLowerCase();
    if (q) {
      items = items.filter((b) => b.bookingReference.toLowerCase().includes(q));
    }
    items = items.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return paginate(items.map(bookingListItem), params.page, params.pageSize);
  },

  async getBooking(id: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const user = requireMockUser(db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking || !ownsBooking(user.email, booking)) {
      throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    }
    return booking;
  },

  async cancelBooking(id: string): Promise<BookingResponse> {
    await simulateLatency();
    const db = readDb();
    const user = requireMockUser(db);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking || !ownsBooking(user.email, booking)) {
      throw new ApiError({ status: 404, title: 'Not found', detail: 'Booking not found' });
    }
    if (booking.status !== 'Pending' && booking.status !== 'Confirmed') {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'This booking can no longer be cancelled' });
    }
    booking.status = 'Cancelled';
    booking.updatedAt = new Date().toISOString().slice(0, 10);
    db.notifications.unshift({
      id: `notif-${Math.random().toString(36).slice(2, 9)}`,
      type: 'BookingCancelled',
      message: `Booking ${booking.bookingReference} has been cancelled`,
      isRead: false,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    db.activityLogs.unshift({
      id: `act-${Math.random().toString(36).slice(2, 9)}`,
      type: 'BookingCancelled',
      message: `Booking ${booking.bookingReference} cancelled by ${user.firstName} ${user.lastName}`,
      actorName: `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString().slice(0, 10),
    });
    writeDb(db);
    return booking;
  },

  async getProfile(): Promise<MeProfile> {
    await simulateLatency();
    const db = readDb();
    const user = requireMockUser(db);
    return toProfile(user);
  },

  async updateProfile(request: SaveProfileRequest): Promise<MeProfile> {
    await simulateLatency();
    const db = readDb();
    const user = requireMockUser(db);
    user.firstName = request.firstName.trim();
    user.lastName = request.lastName.trim();
    user.email = request.email.trim().toLowerCase();
    user.phoneNumber = request.phoneNumber?.trim() ?? '';
    writeDb(db);
    return toProfile(user);
  },
};