/**
 * Fallback stay policy used before (or if) the public /stay-policy endpoint
 * responds. Mirrors the backend defaults (SoT v1.12) so the booking forms stay
 * usable during the first paint.
 */
import type { StayPolicy } from '@/types';
import { appConfig } from './appConfig';

export const DEFAULT_STAY_POLICY: StayPolicy = {
  defaultCheckInTime: appConfig.checkInTime,
  defaultCheckOutTime: appConfig.checkOutTime,
  timeSlotMinutes: 30,
  earliestCheckInTime: '00:00',
  latestCheckInTime: '23:30',
  earliestCheckOutTime: '00:00',
  latestCheckOutTime: '23:30',
  maxExtraHoursPerStay: 6,
  turnaroundMinutes: 0,
};
