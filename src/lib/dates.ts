import { addDays, differenceInCalendarDays, format, parse, parseISO } from 'date-fns';
import type { StayPolicy } from '@/types';
import { appConfig } from '@/config/appConfig';

/** The hotel's timezone: fixed UTC+1 with no daylight saving. */
export const LAGOS_TIME_ZONE = 'Africa/Lagos';
const LAGOS_OFFSET = '+01:00';

/** Number of nights between two "yyyy-MM-dd" dates (check-out day not counted). */
export function nightsBetween(checkInDate: string, checkOutDate: string): number {
  return differenceInCalendarDays(parseISO(checkOutDate), parseISO(checkInDate));
}

/** Format an ISO date as "10 Oct 2026". */
export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd MMM yyyy');
}

/** Format an ISO date-time as "10 Oct 2026, 09:30". */
export function formatDateTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), 'dd MMM yyyy, HH:mm');
}

/** Format an ISO date as "October 10, 2026". */
export function formatLongDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMMM d, yyyy');
}

/** "10 Oct 2026 — 15 Oct 2026" */
export function formatStayRange(checkInDate: string, checkOutDate: string): string {
  return `${formatDisplayDate(checkInDate)} \u2014 ${formatDisplayDate(checkOutDate)}`;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDaysISO(isoDate: string, days: number): string {
  return format(addDays(parseISO(isoDate), days), 'yyyy-MM-dd');
}

export function formatCheckInDate(isoDate: string): string {
  return `${formatDisplayDate(isoDate)} · check-in from ${appConfig.checkInTime}`;
}

/** Newest date first. */
export function sortDatesDescending(dates: string[]): string[] {
  return [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/**
 * The scheduled check-out moment for a booking: its check-out date at the hotel's
 * check-out time (Africa/Lagos, a fixed UTC+1 offset with no daylight saving).
 */
export function scheduledCheckOutMoment(checkOutDate: string, checkOutTime = '12:00'): Date {
  const time = /^\d{2}:\d{2}$/.test(checkOutTime) ? checkOutTime : '12:00';
  return new Date(`${checkOutDate}T${time}:00+01:00`);
}

/**
 * True when the given moment is before a booking's scheduled check-out moment.
 * Used to offer the early check-out dialog up front; the backend remains the
 * authority and returns `booking.early_checkout_requires_consent` regardless.
 */
export function isEarlyCheckOut(checkOutDate: string, checkOutTime = '12:00', now: Date = new Date()): boolean {
  const scheduled = scheduledCheckOutMoment(checkOutDate, checkOutTime);
  return !Number.isNaN(scheduled.getTime()) && now.getTime() < scheduled.getTime();
}

/* ----------------------- Stay date + time helpers ------------------------ */

/** "14:00", "14:00:00" or "9:05" → "HH:mm"; null when unparseable. */
export function normaliseTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** "14:00" → "2:00 PM". Empty/unparseable input is returned as-is (or blank). */
export function formatTime12h(value: string | null | undefined): string {
  if (!value) return '';
  const t = normaliseTime(value);
  if (!t) return value;
  return format(parse(t, 'HH:mm', new Date()), 'h:mm a');
}

export function timeToMinutes(value: string): number | null {
  const t = normaliseTime(value);
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

export function isOnSlotGrid(time: string, stepMinutes: number): boolean {
  const minutes = timeToMinutes(time);
  if (minutes == null || stepMinutes <= 0) return false;
  return minutes % stepMinutes === 0;
}

/** True when `time` is inside the inclusive [earliest, latest] window. */
export function withinTimeRange(time: string, earliest: string, latest: string): boolean {
  const t = timeToMinutes(time);
  const lo = timeToMinutes(earliest);
  const hi = timeToMinutes(latest);
  if (t == null || lo == null || hi == null) return false;
  return t >= lo && t <= hi;
}

/** Every "HH:mm" on the slot grid within [earliest, latest] inclusive. */
export function timeSlots(earliest: string, latest: string, stepMinutes: number): string[] {
  const start = timeToMinutes(earliest);
  const end = timeToMinutes(latest);
  const step = stepMinutes > 0 ? stepMinutes : 30;
  if (start == null || end == null || end < start) return [];
  const slots: string[] = [];
  for (let m = Math.ceil(start / step) * step; m <= end; m += step) slots.push(minutesToTime(m));
  return slots;
}

/** Floor a "HH:mm" time down to the previous slot boundary. */
export function floorToSlot(time: string, stepMinutes: number): string {
  const minutes = timeToMinutes(time) ?? 0;
  const step = stepMinutes > 0 ? stepMinutes : 30;
  return minutesToTime(Math.floor(minutes / step) * step);
}

/** The current date + time in Africa/Lagos as "yyyy-MM-dd" / "HH:mm". */
export function lagosNow(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` };
}

export function todayLagosISO(now: Date = new Date()): string {
  return lagosNow(now).date;
}

/** Build a Lagos-local instant (e.g. "2026-10-13T14:00:00+01:00") from a date + "HH:mm". */
export function lagosDateTimeISO(date: string, time: string): string {
  const t = normaliseTime(time) ?? '00:00';
  return `${date}T${t}:00${LAGOS_OFFSET}`;
}

/** Display an ISO instant in Africa/Lagos, e.g. "13 Oct 2026, 2:00 PM". */
export function formatInstant(iso: string, opts: { date?: boolean; time?: boolean } = {}): string {
  const withDate = opts.date ?? true;
  const withTime = opts.time ?? true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(d);
  if (withDate && withTime) return `${datePart}, ${timePart}`;
  return withDate ? datePart : timePart;
}

/** "13 Oct 2026 · 2:00 PM" for a local date + "HH:mm". */
export function formatStayMoment(date: string, time: string): string {
  return `${formatDisplayDate(date)} · ${formatTime12h(time)}`;
}

export type StayErrorCode = 'stay.invalid_range' | 'stay.time_not_allowed' | 'stay.too_long_for_nights' | 'stay.in_the_past';

export interface StayValidationError {
  code: StayErrorCode;
  message: string;
}

export interface StayWindowInput {
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
}

/**
 * Client-side mirror of the backend stay-policy validation (SoT v1.12). Returns
 * the first failing `stay.*` rule, or null when the window looks valid. The
 * backend remains the authority; this only short-circuits obvious mistakes.
 */
export function validateStayWindow(
  input: StayWindowInput,
  policy: StayPolicy,
  options: { isStaffWalkIn?: boolean; now?: Date } = {},
): StayValidationError | null {
  const { checkInDate, checkInTime, checkOutDate, checkOutTime } = input;
  if (checkOutDate <= checkInDate) return { code: 'stay.invalid_range', message: 'Check-out must be after check-in' };

  const inTime = normaliseTime(checkInTime);
  const outTime = normaliseTime(checkOutTime);
  if (!inTime || !outTime) return { code: 'stay.time_not_allowed', message: 'Enter a valid check-in and check-out time' };
  if (!isOnSlotGrid(inTime, policy.timeSlotMinutes) || !isOnSlotGrid(outTime, policy.timeSlotMinutes))
    return { code: 'stay.time_not_allowed', message: `Times must align to ${policy.timeSlotMinutes}-minute intervals` };
  if (!withinTimeRange(inTime, policy.earliestCheckInTime, policy.latestCheckInTime))
    return {
      code: 'stay.time_not_allowed',
      message: `Check-in must be between ${formatTime12h(policy.earliestCheckInTime)} and ${formatTime12h(policy.latestCheckInTime)}`,
    };
  if (!withinTimeRange(outTime, policy.earliestCheckOutTime, policy.latestCheckOutTime))
    return {
      code: 'stay.time_not_allowed',
      message: `Check-out must be between ${formatTime12h(policy.earliestCheckOutTime)} and ${formatTime12h(policy.latestCheckOutTime)}`,
    };

  const nights = nightsBetween(checkInDate, checkOutDate);
  const checkInAt = new Date(lagosDateTimeISO(checkInDate, inTime));
  const checkOutAt = new Date(lagosDateTimeISO(checkOutDate, outTime));
  const allowedHours = nights * 24 + policy.maxExtraHoursPerStay;
  if (checkOutAt.getTime() - checkInAt.getTime() > allowedHours * 3_600_000)
    return { code: 'stay.too_long_for_nights', message: `A ${nights}-night stay may not exceed ${allowedHours} hours` };

  if (!options.isStaffWalkIn && checkInAt.getTime() < (options.now ?? new Date()).getTime())
    return { code: 'stay.in_the_past', message: 'Check-in time cannot be in the past' };

  return null;
}