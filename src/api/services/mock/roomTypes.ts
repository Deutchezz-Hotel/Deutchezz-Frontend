import { ApiError } from '@/api/problem';
import type { RoomTypeResponse } from '@/types';
import { readDb } from './db';
import { simulateLatency } from './latency';

export const mockRoomTypesApi = {
  async list(): Promise<RoomTypeResponse[]> {
    await simulateLatency();
    return readDb().roomTypes.filter((t) => t.isActive);
  },

  async get(id: string): Promise<RoomTypeResponse> {
    await simulateLatency();
    const type = readDb().roomTypes.find((t) => t.id === id);
    if (!type) {
      throw new ApiError({ status: 404, title: 'Not found', detail: 'That room type could not be found' });
    }
    return type;
  },
};