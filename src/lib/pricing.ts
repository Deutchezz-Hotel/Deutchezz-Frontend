import type { StayPolicy } from '@/types';
import { nightsBetween } from './dates';

export interface StayWindow {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
}

export function overageHours(window: StayWindow): number {
  const nights = Math.max(0, nightsBetween(window.checkInDate, window.checkOutDate));
  const checkInAt = new Date(window.checkInDate + 'T' + window.checkInTime + ':00+01:00');
  const checkOutAt = new Date(window.checkOutDate + 'T' + window.checkOutTime + ':00+01:00');
  const durationMs = checkOutAt.getTime() - checkInAt.getTime();
  if (!Number.isFinite(durationMs)) return 0;
  const totalHours = durationMs / 3_600_000;
  const allowedBase = nights * 24;
  const overage = totalHours - allowedBase;
  if (overage <= 0) return 0;
  return Math.min(overage, 24);
}

export function extraChargeForLine(
  ratePerNight: number,
  quantity: number,
  overageHours: number,
  policy: StayPolicy,
): number {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty === 0 || ratePerNight <= 0 || overageHours <= 0) return 0;
  const grace = policy.graceHours ?? 2;
  const half = policy.halfDayHours ?? 6;
  const halfPct = policy.halfDayPercent ?? 50;
  const fullPct = policy.fullNightPercent ?? 100;
  let percent = 0;
  if (overageHours > grace && overageHours <= half) {
    percent = halfPct;
  } else if (overageHours > half) {
    percent = fullPct;
  } else {
    percent = 0;
  }
  if (percent <= 0) return 0;
  const charge = (ratePerNight * qty * percent) / 100;
  return Math.round(charge * 100) / 100;
}
