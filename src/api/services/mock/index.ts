import type { ServiceCollection } from '../interfaces';
import { mockAuthApi } from './auth';
import { mockRoomTypesApi } from './roomTypes';
import { mockAvailabilityApi } from './availability';
import { mockBookingsApi } from './bookings';
import { mockMeApi } from './me';
import { mockReceptionApi } from './reception';
import { mockAdminApi } from './admin';

export const mockServices: ServiceCollection = {
  auth: mockAuthApi,
  roomTypes: mockRoomTypesApi,
  availability: mockAvailabilityApi,
  bookings: mockBookingsApi,
  me: mockMeApi,
  reception: mockReceptionApi,
  admin: mockAdminApi,
};