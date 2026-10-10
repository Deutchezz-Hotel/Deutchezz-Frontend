import { ApiError } from '@/api/problem';
import type { AvailabilityResponse, AvailabilitySearchRequest } from '@/types';
import { nightsBetween } from '@/lib/dates';
import { readDb } from './db';
import { simulateLatency } from './latency';
import { searchAvailability } from './rules';

export const mockAvailabilityApi = {
  async search(request: AvailabilitySearchRequest): Promise<AvailabilityResponse> {
    await simulateLatency();
    const errors: Record<string, string[]> = {};
    if (!request.checkInDate) errors.checkInDate = ['Select a check-in date'];
    if (!request.checkOutDate) errors.checkOutDate = ['Select a check-out date'];
    if (request.checkInDate && request.checkOutDate && nightsBetween(request.checkInDate, request.checkOutDate) < 1) {
      errors.checkOutDate = ['Check-out must be after check-in'];
    }
    if (!request.rooms || request.rooms < 1) errors.rooms = ['Select at least one room'];
    if (Object.keys(errors).length > 0) {
      throw new ApiError({ status: 400, title: 'Validation failed', detail: 'Please check the search details', errors });
    }

    const db = readDb();
    return searchAvailability(request.checkInDate, request.checkOutDate, db.roomTypes, db.rooms, db.bookings);
  },
};