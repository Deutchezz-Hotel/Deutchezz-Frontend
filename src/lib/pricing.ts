import type { BookingResponse } from '@/types';

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

type OverageSource = Pick<BookingResponse, 'checkInAt' | 'checkOutAt' | 'actualCheckOutAt' | 'nights'>;

/**
 * Whole minutes of a stay beyond the booked `nights × 24 h`. Mirrors the backend
 * charging basis: the actual check-out instant wins once the guest has left, so a
 * booking repriced at an actual late check-out reports the final overage. The
 * amount itself always comes from the stored field, never inferred here.
 */
export function bookingOverageMinutes(booking: OverageSource): number {
  const end = booking.actualCheckOutAt ?? booking.checkOutAt;
  const startMs = new Date(booking.checkInAt).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  const wholeMinutes = Math.floor((endMs - startMs) / MS_PER_MINUTE);
  return Math.max(0, wholeMinutes - booking.nights * MINUTES_PER_DAY);
}

/** Overage expressed in hours (one decimal at most), e.g. 3 or 3.5. */
export function overageHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/** Guest-facing charge label, e.g. "Extended stay (3 hrs beyond 24 hrs)". */
export function extendedStayLabel(minutes: number): string {
  return `Extended stay (${overageHours(minutes)} hrs beyond 24 hrs)`;
}

/** True when there is an overage but it sits inside the free grace period. */
export function isWithinGrace(minutes: number, graceHours: number): boolean {
  return minutes > 0 && minutes <= graceHours * 60;
}

export const WITHIN_GRACE_NOTE = 'Within the free grace period';

/**
 * Grace-period explanation with the value read from settings (never hardcoded),
 * e.g. "Extra charges apply for time beyond 24 hours. The first 2 hours are a
 * free grace period, so charges start after 26 hours."
 */
export function gracePeriodNote(graceHours: number): string {
  return `Extra charges apply for time beyond 24 hours. The first ${graceHours} hours are a free grace period, so charges start after ${24 + graceHours} hours.`;
}
