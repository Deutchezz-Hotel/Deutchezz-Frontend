import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { appConfig } from '@/config/appConfig';

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