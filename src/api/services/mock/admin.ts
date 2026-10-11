/**
 * Mock admin API. All operations require Administrator role.
 */
import { ApiError } from '@/api/problem';
import type {
  ActivityLog,
  AdminDashboard,
  AdminReports,
  AppNotification,
  BookingListItem,
  BookingStatus,
  Paginated,
  PaymentListItem,
  PaymentMethod,
  Room,
  RoomTypeResponse,
  SaveRoomRequest,
  SaveRoomTypeRequest,
  SaveSettingsRequest,
  SaveStaffRequest,
  Staff,
} from '@/types';
import { initialsOf, newId } from '@/lib/id';
import { effectiveRoomStatus, readDb, writeDb, type MockDbData } from './db';
import { simulateLatency } from './latency';
import { paginate } from './rules';
import { deriveGuests, filterBookings } from './selectors';
import { requireRole } from './session';

const ACTOR = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

function pushActivity(db: MockDbData, type: ActivityLog['type'], message: string, actorName: string) {
  db.activityLogs.unshift({
    id: `act-${Math.random().toString(36).slice(2, 9)}`,
    type,
    message,
    actorName,
    timestamp: new Date().toISOString().slice(0, 10),
  });
}

export const mockAdminApi = {
  async dashboard(): Promise<AdminDashboard> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);

    const rooms = db.rooms;
    const bookings = db.bookings;
    const availableRooms = rooms.filter((r) => r.status === 'Available').length;
    const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
    const occupancyRate = Math.round((occupiedRooms / Math.max(1, rooms.length)) * 100);
    const activeBookings = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'CheckedIn' || b.status === 'Pending').length;

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = bookings
      .filter((b) => b.status !== 'Cancelled' && parseInt(b.checkOutDate.slice(0, 4)) === start.getFullYear() && parseInt(b.checkOutDate.slice(5, 7)) === start.getMonth() + 1)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const totalRevenue = bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalAmount, 0);

    const last30 = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      const rev = bookings
        .filter((b) => b.status !== 'Cancelled' && b.createdAt === key)
        .reduce((sum, b) => sum + b.totalAmount, 0);
      return { date: key, revenue: rev };
    });

    const roomTypePerformance = db.roomTypes
      .map((rt) => {
        const rev = bookings
          .filter((b) => b.status !== 'Cancelled')
          .flatMap((b) => b.rooms)
          .filter((line) => line.roomTypeId === rt.id)
          .reduce((sum, line) => sum + line.subtotal, 0);
        return { roomTypeId: rt.id, name: rt.name, bookedNights: 0, revenue: rev };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRooms: rooms.length,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      activeBookings,
      monthlyRevenue,
      totalRevenue,
      revenueTrend: last30,
      bookingsByStatus: (['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'] as BookingStatus[]).map((s) => ({ status: s, count: bookings.filter((b) => b.status === s).length })),
      roomTypePerformance,
    };
  },

  async listRooms(params: { page?: number; pageSize?: number; search?: string; status?: string; date?: string }): Promise<Paginated<Room>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let rooms = db.rooms.map((r) => ({ ...r, effectiveStatus: effectiveRoomStatus(db, r, params.date) }));
    if (params.status && params.status !== 'All') rooms = rooms.filter((r) => r.effectiveStatus === params.status);
    const q = params.search?.trim().toLowerCase();
    if (q) rooms = rooms.filter((r) => `${r.roomNumber} ${r.roomTypeName}`.toLowerCase().includes(q));
    return paginate(rooms, params.page, params.pageSize);
  },

  async createRoom(request: SaveRoomRequest): Promise<Room> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    if (db.rooms.some((r) => r.roomNumber.toLowerCase() === request.roomNumber.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'Room number already exists', errors: { roomNumber: ['Room number already exists'] } });
    }
    const type = db.roomTypes.find((t) => t.id === request.roomTypeId);
    const room: Room = {
      id: `room-${Math.random().toString(36).slice(2, 9)}`,
      roomNumber: request.roomNumber,
      floor: request.floor,
      roomTypeId: request.roomTypeId,
      roomTypeName: type?.name ?? request.roomTypeId,
      status: request.status,
    };
    db.rooms.push(room);
    pushActivity(db, 'RoomStatusChanged', `Room ${room.roomNumber} added`, ACTOR(actor));
    writeDb(db);
    return room;
  },

  async getRoom(id: string): Promise<Room> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    const room = db.rooms.find((r) => r.id === id);
    if (!room) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room not found' });
    return room;
  },

  async updateRoom(id: string, request: SaveRoomRequest): Promise<Room> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const room = db.rooms.find((r) => r.id === id);
    if (!room) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room not found' });
    if (request.roomNumber && request.roomNumber.toLowerCase() !== room.roomNumber.toLowerCase() && db.rooms.some((r) => r.roomNumber.toLowerCase() === request.roomNumber!.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'Room number already exists', errors: { roomNumber: ['Room number already exists'] } });
    }
    const type = db.roomTypes.find((t) => t.id === request.roomTypeId);
    room.roomNumber = request.roomNumber;
    room.floor = request.floor;
    room.roomTypeId = request.roomTypeId;
    room.roomTypeName = type?.name ?? request.roomTypeId;
    room.status = request.status;
    pushActivity(db, 'RoomStatusChanged', `Room ${room.roomNumber} updated`, ACTOR(actor));
    writeDb(db);
    return room;
  },

  async updateRoomStatus(id: string, status: Room['status']): Promise<Room> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const room = db.rooms.find((r) => r.id === id);
    if (!room) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room not found' });
    room.status = status;
    pushActivity(db, 'RoomStatusChanged', `Room ${room.roomNumber} status set to ${status}`, ACTOR(actor));
    writeDb(db);
    return room;
  },

  async listRoomTypes(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<RoomTypeResponse>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let types = db.roomTypes.slice();
    const q = params.search?.trim().toLowerCase();
    if (q) types = types.filter((t) => t.name.toLowerCase().includes(q));
    return paginate(types, params.page, params.pageSize);
  },

  async createRoomType(request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    if (db.roomTypes.some((t) => t.name.toLowerCase() === request.name.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'A room type with that name already exists', errors: { name: ['A room type with that name already exists'] } });
    }
    const type: RoomTypeResponse = {
      id: newId('room-type'),
      name: request.name,
      description: request.description,
      basePrice: request.basePrice,
      maximumOccupancy: request.maximumOccupancy,
      bedType: request.bedType,
      imageUrls: request.imageUrls,
      features: request.features,
      isActive: true,
    };
    db.roomTypes.push(type);
    pushActivity(db, 'RoomTypeCreated', `Room type "${type.name}" created`, ACTOR(actor));
    writeDb(db);
    return type;
  },

  async getRoomType(id: string): Promise<RoomTypeResponse> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    const type = db.roomTypes.find((t) => t.id === id);
    if (!type) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room type not found' });
    return type;
  },

  async updateRoomType(id: string, request: SaveRoomTypeRequest): Promise<RoomTypeResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const type = db.roomTypes.find((t) => t.id === id);
    if (!type) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room type not found' });
    if (request.name && request.name.toLowerCase() !== type.name.toLowerCase() && db.roomTypes.some((t) => t.name.toLowerCase() === request.name!.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'A room type with that name already exists', errors: { name: ['A room type with that name already exists'] } });
    }
    type.name = request.name;
    type.description = request.description;
    type.basePrice = request.basePrice;
    type.maximumOccupancy = request.maximumOccupancy;
    type.bedType = request.bedType;
    type.imageUrls = request.imageUrls;
    type.features = request.features;
    pushActivity(db, 'RoomTypeUpdated', `Room type "${type.name}" updated`, ACTOR(actor));
    writeDb(db);
    return type;
  },

  async updateRoomTypeStatus(id: string, isActive: boolean): Promise<RoomTypeResponse> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const type = db.roomTypes.find((t) => t.id === id);
    if (!type) throw new ApiError({ status: 404, title: 'Not found', detail: 'Room type not found' });
    type.isActive = isActive;
    pushActivity(db, 'RoomStatusChanged', `Room type "${type.name}" ${isActive ? 'activated' : 'deactivated'}`, ACTOR(actor));
    writeDb(db);
    return type;
  },

  async listBookings(params: import('@/api').BookingFilterParams): Promise<Paginated<BookingListItem>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    return paginate(filterBookings(db, params), params.page, params.pageSize);
  },

  async listGuests(params: { page?: number; pageSize?: number; search?: string }): Promise<import('@/types').Paginated<import('@/types').GuestListItem>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let guests = deriveGuests(db);
    const q = params.search?.trim().toLowerCase();
    if (q) guests = guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || g.email.toLowerCase().includes(q));
    return paginate(guests, params.page, params.pageSize);
  },

  async listStaff(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<Staff>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let staff = db.staff.slice();
    const q = params.search?.trim().toLowerCase();
    if (q) staff = staff.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    return paginate(staff, params.page, params.pageSize);
  },

  async createStaff(request: SaveStaffRequest): Promise<Staff> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    if (db.staff.some((s) => s.email.toLowerCase() === request.email.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'A staff member with that email already exists', errors: { email: ['A staff member with that email already exists'] } });
    }
    const staff: Staff = {
      id: newId('staff'),
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email.toLowerCase(),
      phoneNumber: request.phoneNumber ?? '',
      role: request.role,
      isActive: true,
      initials: initialsOf(request.firstName, request.lastName),
    };
    db.staff.push(staff);
    pushActivity(db, 'StaffCreated', `Staff "${staff.firstName} ${staff.lastName}" added`, ACTOR(actor));
    writeDb(db);
    return staff;
  },

  async getStaff(id: string): Promise<Staff> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    const staff = db.staff.find((s) => s.id === id);
    if (!staff) throw new ApiError({ status: 404, title: 'Not found', detail: 'Staff member not found' });
    return staff;
  },

  async updateStaff(id: string, request: SaveStaffRequest): Promise<Staff> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const staff = db.staff.find((s) => s.id === id);
    if (!staff) throw new ApiError({ status: 404, title: 'Not found', detail: 'Staff member not found' });
    if (request.email && request.email.toLowerCase() !== staff.email && db.staff.some((s) => s.email.toLowerCase() === request.email!.toLowerCase())) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'A staff member with that email already exists', errors: { email: ['A staff member with that email already exists'] } });
    }
    staff.firstName = request.firstName;
    staff.lastName = request.lastName;
    staff.email = request.email.toLowerCase();
    staff.phoneNumber = request.phoneNumber ?? '';
    staff.role = request.role;
    staff.initials = initialsOf(staff.firstName, staff.lastName);
    pushActivity(db, 'StaffUpdated', `Staff "${staff.firstName} ${staff.lastName}" updated`, ACTOR(actor));
    writeDb(db);
    return staff;
  },

  async updateStaffStatus(id: string, isActive: boolean): Promise<Staff> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    const staff = db.staff.find((s) => s.id === id);
    if (!staff) throw new ApiError({ status: 404, title: 'Not found', detail: 'Staff member not found' });
    staff.isActive = isActive;
    pushActivity(db, 'StaffUpdated', `Staff "${staff.firstName} ${staff.lastName}" ${isActive ? 'activated' : 'deactivated'}`, ACTOR(actor));
    writeDb(db);
    return staff;
  },

  async listPayments(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<PaymentListItem>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let payments = db.payments.slice().sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
    const q = params.search?.trim().toLowerCase();
    if (q) {
      payments = payments.filter(
        (p) =>
          p.guestName.toLowerCase().includes(q) ||
          p.bookingReference.toLowerCase().includes(q) ||
          (p.reference ?? '').toLowerCase().includes(q),
      );
    }
    return paginate(payments, params.page, params.pageSize);
  },

  async reports(): Promise<AdminReports> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    const bookings = db.bookings.filter((b) => b.status !== 'Cancelled');
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const roomNights = bookings.reduce((sum, b) => sum + b.nights, 0);
    const totalRooms = db.rooms.length;
    const occupiedNights = db.bookings
      .filter((b) => b.status === 'CheckedOut')
      .reduce((sum, b) => sum + b.nights, 0);
    const occupancyRate = Math.round((occupiedNights / Math.max(1, totalRooms * 30)) * 100);
    const adr = totalRevenue / Math.max(1, bookings.length);
    const revpar = totalRevenue / Math.max(1, totalRooms * 30);
    const averageStayNights = roomNights / Math.max(1, bookings.length);
    const last30 = bookings.slice(0, 30).map((b) => ({ date: b.checkInDate, revenue: b.totalAmount }));
    return {
      occupancyRate,
      adr: Math.round(adr),
      revpar: Math.round(revpar),
      totalRevenue,
      averageStayNights: Number(averageStayNights.toFixed(2)),
      revenueTrend: last30,
      bookingsByStatus: (['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'] as BookingStatus[]).map((s) => ({ status: s, count: db.bookings.filter((b) => b.status === s).length })),
      bookingsByPaymentMethod: db.payments.reduce<{ paymentMethod: PaymentMethod; count: number }[]>((acc, p) => {
        const key = p.paymentMethod;
        const found = acc.find((x) => x.paymentMethod === key);
        if (found) found.count += 1;
        else acc.push({ paymentMethod: key, count: 1 });
        return acc;
      }, []),
    };
  },

  async listActivityLogs(params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<ActivityLog>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    let logs = db.activityLogs.slice();
    const q = params.search?.trim().toLowerCase();
    if (q) logs = logs.filter((l) => l.message.toLowerCase().includes(q) || l.actorName.toLowerCase().includes(q));
    return paginate(logs, params.page, params.pageSize);
  },

  async listNotifications(params: { page?: number; pageSize?: number }): Promise<Paginated<AppNotification>> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    return paginate(db.notifications.slice(), params.page, params.pageSize);
  },

  async getSettings(): Promise<import('@/types').HotelSettings> {
    await simulateLatency();
    const db = readDb();
    requireRole(['Administrator'], db);
    return db.settings;
  },

  async updateSettings(request: SaveSettingsRequest): Promise<import('@/types').HotelSettings> {
    await simulateLatency();
    const db = readDb();
    const actor = requireRole(['Administrator'], db);
    db.settings.hotelName = request.hotelName ?? db.settings.hotelName;
    db.settings.phoneNumber = request.phoneNumber ?? db.settings.phoneNumber;
    db.settings.email = request.email ?? db.settings.email;
    db.settings.currency = request.currency ?? db.settings.currency;
    db.settings.checkInTime = request.checkInTime ?? db.settings.checkInTime;
    db.settings.checkOutTime = request.checkOutTime ?? db.settings.checkOutTime;
    db.settings.maxRoomsPerBooking = request.maxRoomsPerBooking ?? db.settings.maxRoomsPerBooking;
    if (request.requireFullPaymentAtCheckIn !== undefined) db.settings.requireFullPaymentAtCheckIn = request.requireFullPaymentAtCheckIn;
    if (request.requirePaymentBeforeCheckOut !== undefined) db.settings.requirePaymentBeforeCheckOut = request.requirePaymentBeforeCheckOut;
    pushActivity(db, 'RoomStatusChanged', 'Hotel settings updated', ACTOR(actor));
    writeDb(db);
    return db.settings;
  },
};