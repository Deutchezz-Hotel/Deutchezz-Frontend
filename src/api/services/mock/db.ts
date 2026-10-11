/**
 * Mock database — persisted to localStorage.
 *
 * Provides reading/writing/reset for the demo dataset. Business rules live in
 * `rules.ts` as pure functions so they can be unit tested; the localStorage
 * wrapper here is only a persistence seam.
 */
import { addDays, format } from 'date-fns';
import { appConfig } from '@/config/appConfig';
import { deriveBookingTotals } from './rules';
import type {
  AppNotification,
  ActivityLog,
  BookingResponse,
  HotelSettings,
  Payment,
  Room,
  RoomTypeResponse,
  Staff,
  UserRole,
} from '@/types';

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
}

export interface MockDbData {
  version: number;
  users: MockUser[];
  roomTypes: RoomTypeResponse[];
  rooms: Room[];
  bookings: BookingResponse[];
  payments: Payment[];
  staff: Staff[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  settings: HotelSettings;
  idempotency: Record<string, { hash: string; bookingId: string }>;
  lookupAttempts: number[];
}

const KEY = 'deutchezz.mockdb.v2';

function iso(dayOffset: number): string {
  return format(addDays(new Date(), dayOffset), 'yyyy-MM-dd');
}

function isoDateTime(dayOffset: number, hour = 12, minute = 0): string {
  return `${iso(dayOffset)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function uid(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

const IMAGES = {
  standard: [
    'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  deluxe: [
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  executive: [
    'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
};

function seedRoomTypes(): RoomTypeResponse[] {
  return [
    {
      id: 'standard',
      name: 'Standard Room',
      description: 'Thoughtfully appointed for effortless stays — everything you need for a restful night in Jos, nothing superfluous.',
      basePrice: 30000,
      maximumOccupancy: 2,
      bedType: 'Queen bed',
      imageUrls: IMAGES.standard,
      features: ['Smart TV', 'Wi-Fi', 'Air conditioning', 'Work desk', 'Coffee station'],
      isActive: true,
    },
    {
      id: 'deluxe',
      name: 'Deluxe Room',
      description: 'A serene retreat with warm textures, ambient lighting, and the quiet indulgence of considered comfort.',
      basePrice: 40000,
      maximumOccupancy: 2,
      bedType: 'King bed',
      imageUrls: IMAGES.deluxe,
      features: ['Smart TV', 'Wi-Fi', 'Rain shower', 'City view', 'Work desk'],
      isActive: true,
    },
    {
      id: 'executive',
      name: 'Executive Room',
      description: 'Where productivity meets tranquility. Generous proportions and elevated amenities create a sanctuary for the business traveller.',
      basePrice: 55000,
      maximumOccupancy: 3,
      bedType: 'King bed',
      imageUrls: IMAGES.executive,
      features: ['Lounge area', 'Wi-Fi', 'Rain shower', 'City view', 'Work desk'],
      isActive: true,
    },
  ];
}

function seedRooms(): Room[] {
  const plans: Array<[number, string[], string[]]> = [
    [1, ['101', '102', '103', '104', '105', '106', '107'], ['standard', 'standard', 'deluxe', 'deluxe', 'executive', 'deluxe', 'standard']],
    [2, ['201', '202', '203', '204', '205', '206', '207'], ['deluxe', 'deluxe', 'standard', 'standard', 'executive', 'executive', 'standard']],
    [3, ['301', '302', '303', '304', '305', '306'], ['executive', 'executive', 'deluxe', 'deluxe', 'standard', 'standard']],
  ];
  const rooms: Room[] = [];
  let idx = 0;
  for (const [floor, numbers, types] of plans) {
    for (let i = 0; i < numbers.length; i++) {
      rooms.push({
        id: `room-${idx + 1}`,
        roomNumber: numbers[i],
        floor,
        roomTypeId: types[i],
        roomTypeName: seedRoomTypes().find((t) => t.id === types[i])?.name ?? types[i],
        status: 'Available',
      });
      idx++;
    }
  }
  return rooms;
}

function seedBookings(): BookingResponse[] {
  const guest = (firstName: string, lastName: string, email: string, phoneNumber: string) => ({ firstName, lastName, email, phoneNumber });

  const graceBooking: BookingResponse = {
    id: 'booking-grace',
    bookingReference: 'DHI-2026-8F42K9',
    status: 'Confirmed',
    paymentStatus: 'Pending',
    checkInDate: iso(7),
    checkOutDate: iso(12),
    nights: 5,
    adults: 2,
    children: 0,
    guest: guest('Grace', 'Ibrahim', 'grace@example.com', '+234 803 123 4567'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-grace-1',
        roomTypeId: 'deluxe',
        roomTypeName: 'Deluxe Room',
        quantity: 1,
        ratePerNight: 40000,
        numberOfNights: 5,
        subtotal: 200000,
      },
    ],
    specialRequests: 'Late arrival requested',
    totalAmount: 200000,
    createdAt: iso(-2),
    updatedAt: iso(-2),
  };

  const davidCheckedIn: BookingResponse = {
    id: 'booking-david',
    bookingReference: 'DHI-2026-7D19PL',
    status: 'CheckedIn',
    paymentStatus: 'PartiallyPaid',
    checkInDate: iso(0),
    checkOutDate: iso(3),
    nights: 3,
    adults: 1,
    children: 0,
    guest: guest('David', 'Musa', 'david@example.com', '+234 802 555 0101'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-david-1',
        roomTypeId: 'executive',
        roomTypeName: 'Executive Room',
        quantity: 1,
        ratePerNight: 55000,
        numberOfNights: 3,
        subtotal: 165000,
        assignedRoomNumbers: ['301'],
      },
    ],
    specialRequests: null,
    totalAmount: 165000,
    createdAt: iso(-5),
    updatedAt: iso(0),
  };

  const estherPending: BookingResponse = {
    id: 'booking-esther',
    bookingReference: 'DHI-2026-51XQ8A',
    status: 'Confirmed',
    paymentStatus: 'Pending',
    checkInDate: iso(1),
    checkOutDate: iso(3),
    nights: 2,
    adults: 1,
    children: 1,
    guest: guest('Esther', 'Samuel', 'esther@example.com', '+234 809 777 8120'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-esther-1',
        roomTypeId: 'standard',
        roomTypeName: 'Standard Room',
        quantity: 1,
        ratePerNight: 30000,
        numberOfNights: 2,
        subtotal: 60000,
      },
    ],
    specialRequests: null,
    totalAmount: 60000,
    createdAt: iso(-1),
    updatedAt: iso(-1),
  };

  const pastCheckedOut: BookingResponse = {
    id: 'booking-peter',
    bookingReference: 'DHI-2026-2N4K6C',
    status: 'CheckedOut',
    paymentStatus: 'Paid',
    checkInDate: iso(-10),
    checkOutDate: iso(-7),
    nights: 3,
    adults: 2,
    children: 0,
    guest: guest('Peter', 'James', 'peter@example.com', '+234 705 333 9900'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-peter-1',
        roomTypeId: 'deluxe',
        roomTypeName: 'Deluxe Room',
        quantity: 2,
        ratePerNight: 40000,
        numberOfNights: 3,
        subtotal: 240000,
        assignedRoomNumbers: ['201', '202'],
      },
    ],
    specialRequests: null,
    totalAmount: 240000,
    createdAt: iso(-20),
    updatedAt: iso(-7),
  };

  const nnamdiUpcoming: BookingResponse = {
    id: 'booking-nnamdi',
    bookingReference: 'DHI-2026-3M7Q2B',
    status: 'Confirmed',
    paymentStatus: 'Pending',
    checkInDate: iso(14),
    checkOutDate: iso(19),
    nights: 5,
    adults: 2,
    children: 1,
    guest: guest('Nnamdi', 'Eze', 'nnamdi@example.com', '+234 810 222 3344'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-nnamdi-1',
        roomTypeId: 'deluxe',
        roomTypeName: 'Deluxe Room',
        quantity: 2,
        ratePerNight: 40000,
        numberOfNights: 5,
        subtotal: 400000,
      },
      {
        bookingRoomTypeId: 'brt-nnamdi-2',
        roomTypeId: 'executive',
        roomTypeName: 'Executive Room',
        quantity: 1,
        ratePerNight: 55000,
        numberOfNights: 5,
        subtotal: 275000,
      },
    ],
    specialRequests: 'High floor if possible',
    totalAmount: 675000,
    createdAt: iso(-3),
    updatedAt: iso(0),
  };

  const gracePast: BookingResponse = {
    id: 'booking-grace-2',
    bookingReference: 'DHI-2026-3Y8Q1C',
    status: 'CheckedOut',
    paymentStatus: 'Paid',
    checkInDate: iso(-40),
    checkOutDate: iso(-37),
    nights: 3,
    adults: 2,
    children: 1,
    guest: guest('Grace', 'Ibrahim', 'grace@example.com', '+234 803 123 4567'),
    rooms: [
      {
        bookingRoomTypeId: 'brt-grace-2-1',
        roomTypeId: 'standard',
        roomTypeName: 'Standard Room',
        quantity: 1,
        ratePerNight: 30000,
        numberOfNights: 3,
        subtotal: 90000,
        assignedRoomNumbers: ['101'],
      },
      {
        bookingRoomTypeId: 'brt-grace-2-2',
        roomTypeId: 'deluxe',
        roomTypeName: 'Deluxe Room',
        quantity: 1,
        ratePerNight: 40000,
        numberOfNights: 3,
        subtotal: 120000,
        assignedRoomNumbers: ['104'],
      },
    ],
    specialRequests: null,
    totalAmount: 210000,
    createdAt: iso(-45),
    updatedAt: iso(-37),
  };

  return [graceBooking, davidCheckedIn, estherPending, pastCheckedOut, nnamdiUpcoming, gracePast];
}

function seedUsers(): MockUser[] {
  return [
    { id: 'user-admin', firstName: 'Adaeze', lastName: 'Okoye', email: 'admin@demo.com', phoneNumber: '+234 800 000 0001', password: 'demo1234', role: 'Administrator' },
    { id: 'user-recep', firstName: 'Tunde', lastName: 'Bakare', email: 'reception@demo.com', phoneNumber: '+234 800 000 0002', password: 'demo1234', role: 'Receptionist' },
    { id: 'user-cust', firstName: 'Grace', lastName: 'Ibrahim', email: 'grace@example.com', phoneNumber: '+234 803 123 4567', password: 'demo1234', role: 'Customer' },
  ];
}

function seedStaff(): Staff[] {
  const s = (id: string, firstName: string, lastName: string, email: string, role: Staff['role']) => ({
    id,
    firstName,
    lastName,
    email,
    phoneNumber: '+234 811 000 0000',
    role,
    isActive: true,
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
  });
  return [
    s('staff-1', 'Chidinma', 'Okafor', 'chidinma@deutchezz.com', 'Receptionist'),
    s('staff-2', 'Femi', 'Adeyemi', 'femi@deutchezz.com', 'Receptionist'),
    s('staff-3', 'Emeka', 'Ugwu', 'emeka@deutchezz.com', 'Administrator'),
  ];
}

function seedPayments(): Payment[] {
  return [
    {
      id: 'pay-1',
      bookingId: 'booking-david',
      bookingReference: 'DHI-2026-7D19PL',
      guestName: 'David Musa',
      payerName: 'David Musa',
      amount: 100000,
      paymentMethod: 'POS',
      reference: 'POS-TXN-88231',
      notes: 'Deposit collected at booking via card on POS',
      recordedByName: 'Tunde Bakare',
      paidAt: isoDateTime(-5, 10, 30),
    },
    {
      id: 'pay-2',
      bookingId: 'booking-peter',
      bookingReference: 'DHI-2026-2N4K6C',
      guestName: 'Peter James',
      payerName: 'Peter James',
      amount: 240000,
      paymentMethod: 'BankTransfer',
      reference: 'BT-REF-44107',
      notes: 'Full stay settled by transfer',
      recordedByName: 'Chidinma Okafor',
      paidAt: isoDateTime(-8, 16, 5),
    },
    {
      id: 'pay-3',
      bookingId: 'booking-grace-2',
      bookingReference: 'DHI-2026-3Y8Q1C',
      guestName: 'Grace Ibrahim',
      payerName: 'Grace Ibrahim',
      amount: 210000,
      paymentMethod: 'Cash',
      reference: null,
      notes: 'Settled on arrival',
      recordedByName: 'Femi Adeyemi',
      paidAt: isoDateTime(-37, 12, 15),
    },
  ];
}

function seedActivityLogs(): ActivityLog[] {
  return [
    { id: 'act-1', type: 'BookingCreated', message: 'Booking DHI-2026-8F42K9 created for Grace Ibrahim', actorName: 'System', timestamp: iso(-2) },
    { id: 'act-2', type: 'PaymentRecorded', message: 'Payment of ₦100,000 recorded for DHI-2026-7D19PL', actorName: 'Tunde Bakare', timestamp: iso(-5) },
    { id: 'act-3', type: 'BookingCheckedIn', message: 'Grace Ibrahim checked in', actorName: 'Chidinma Okafor', timestamp: iso(-4) },
  ];
}

function seedNotifications(): AppNotification[] {
  return [
    { id: 'notif-1', type: 'BookingConfirmed', message: 'Booking DHI-2026-8F42K9 is confirmed', isRead: false, createdAt: iso(-2) },
    { id: 'notif-2', type: 'PaymentReceived', message: 'Payment received for DHI-2026-7D19PL', isRead: false, createdAt: iso(-5) },
  ];
}

function seedSettings(): HotelSettings {
  return {
    hotelName: appConfig.hotelName,
    addressLine1: appConfig.addressLines[0],
    addressLine2: [appConfig.addressLines[1], appConfig.addressLines[2]].join(', '),
    phoneNumber: appConfig.phoneNumber,
    email: appConfig.email,
    currency: appConfig.currency,
    checkInTime: appConfig.checkInTime,
    checkOutTime: appConfig.checkOutTime,
    maxRoomsPerBooking: appConfig.maxRoomsPerBooking,
    requireFullPaymentAtCheckIn: false,
    requirePaymentBeforeCheckOut: false,
  };
}

export function createSeedData(): MockDbData {
  const roomTypes = seedRoomTypes();
  const bookings = seedBookings();
  deriveBookingTotals(bookings, roomTypes);
  return {
    version: 3,
    users: seedUsers(),
    roomTypes,
    rooms: seedRooms(),
    bookings,
    payments: seedPayments(),
    staff: seedStaff(),
    activityLogs: seedActivityLogs(),
    notifications: seedNotifications(),
    settings: seedSettings(),
    idempotency: {},
    lookupAttempts: [],
  };
}

function safeGet(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable */
  }
}

export function readDb(): MockDbData {
  const raw = safeGet();
  if (raw) {
    try {
      const db = JSON.parse(raw) as MockDbData;
      deriveBookingTotals(db.bookings, db.roomTypes);
      for (const b of db.bookings) {
        if (!b.updatedAt) b.updatedAt = b.createdAt;
      }
      // Fill keys added after a persisted snapshot's version with today's defaults.
      db.settings = { ...seedSettings(), ...db.settings };
      return db;
    } catch {
      /* corrupted — reseed */
    }
  }
  const seeded = createSeedData();
  writeDb(seeded);
  return seeded;
}

export function writeDb(db: MockDbData): void {
  safeSet(JSON.stringify(db));
}

export function resetDb(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function getOrCreateUser(db: MockDbData, profile: { firstName: string; lastName: string; email: string; phoneNumber?: string }): MockUser {
  const email = profile.email.toLowerCase();
  const existing = db.users.find((u) => u.email === email);
  if (existing) return existing;
  const user: MockUser = {
    id: `user-${uid('')}`,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email,
    phoneNumber: profile.phoneNumber ?? '',
    password: 'temporary',
    role: 'Customer',
  };
  db.users.push(user);
  return user;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Date-aware occupancy for the mock room board (mirrors the backend concept):
 * for a given date a room is Occupied when a live (Confirmed/CheckedIn) booking
 * whose stay covers the date has it assigned, else Available. Maintenance and
 * Inactive are always physical; with no date the physical status is returned.
 */
export function effectiveRoomStatus(db: MockDbData, room: Room, date?: string): Room['status'] {
  if (room.status === 'Maintenance' || room.status === 'Inactive') return room.status;
  if (date) {
    const occupied = db.bookings.some(
      (b) =>
        (b.status === 'Confirmed' || b.status === 'CheckedIn') &&
        b.checkInDate <= date &&
        b.checkOutDate > date &&
        (b.rooms ?? []).some((line) => (line.assignedRoomNumbers ?? []).includes(room.roomNumber)),
    );
    return occupied ? 'Occupied' : 'Available';
  }
  return room.status;
}