/** Shared read-only selectors over the mock database. */
import type { BookingListItem, GuestListItem } from '@/types';
import { initialsOf } from '@/lib/id';
import type { MockDbData } from './db';
import { bookingListItem } from './rules';

export interface BookingFilter {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: 'createdAt' | 'updatedAt';
  direction?: 'asc' | 'desc';
}

export function filterBookings(db: MockDbData, params: BookingFilter): BookingListItem[] {
  let items = db.bookings.slice();
  if (params.status && params.status !== 'All') {
    items = items.filter((b) => b.status === params.status);
  }
  if (params.dateFrom) items = items.filter((b) => b.checkInDate >= params.dateFrom!);
  if (params.dateTo) items = items.filter((b) => b.checkInDate <= params.dateTo!);
  const q = params.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (b) =>
        b.bookingReference.toLowerCase().includes(q) ||
        `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().includes(q) ||
        b.guest.email.toLowerCase().includes(q),
    );
  }
  if (params.sort === 'createdAt' || params.sort === 'updatedAt') {
    const key = params.sort;
    const dir = params.direction === 'asc' ? 1 : -1;
    items.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
  } else {
    items.sort((a, b) => (a.checkInDate < b.checkInDate ? 1 : a.checkInDate > b.checkInDate ? -1 : 0));
  }
  return items.map(bookingListItem);
}

export function deriveGuests(db: MockDbData): GuestListItem[] {
  const map = new Map<string, GuestListItem>();
  for (const b of db.bookings) {
    const email = b.guest.email.toLowerCase();
    let guest = map.get(email);
    if (!guest) {
      guest = {
        id: b.guest.email,
        firstName: b.guest.firstName,
        lastName: b.guest.lastName,
        email: b.guest.email,
        phoneNumber: b.guest.phoneNumber,
        initials: initialsOf(b.guest.firstName, b.guest.lastName),
        totalBookings: 0,
        inHouse: false,
      };
      map.set(email, guest);
    }
    guest.totalBookings += 1;
    if (!guest.lastStayDate || b.checkInDate > guest.lastStayDate) guest.lastStayDate = b.checkInDate;
    if (b.status === 'CheckedIn') {
      guest.inHouse = true;
      guest.currentRoomNumbers = [...(guest.currentRoomNumbers ?? []), ...b.rooms.flatMap((r) => r.assignedRoomNumbers ?? [])];
    }
  }
  return Array.from(map.values());
}