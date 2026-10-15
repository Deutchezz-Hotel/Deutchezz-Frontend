import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  computeDefaultCheckOut,
  defaultCheckIn,
  floorToSlot,
  formatDisplayDate,
  formatInstant,
  formatStayRange,
  formatTime12h,
  isCheckInSlotSelectable,
  isEarlyCheckOut,
  isOnSlotGrid,
  lagosDateTimeISO,
  lagosNow,
  minutesToTime,
  nextCheckInSlot,
  nightsBetween,
  normaliseTime,
  scheduledCheckOutMoment,
  sortDatesDescending,
  timeSlots,
  timeToMinutes,
  validateStayWindow,
  withinTimeRange,
} from './dates';
import type { StayPolicy } from '@/types';

const POLICY: StayPolicy = {
  defaultCheckInTime: '14:00',
  defaultCheckOutTime: '12:00',
  timeSlotMinutes: 30,
  earliestCheckInTime: '08:00',
  latestCheckInTime: '22:00',
  earliestCheckOutTime: '06:00',
  latestCheckOutTime: '14:00',
  turnaroundMinutes: 0,
  graceHours: 2,
  maxStayNights: 30,
};

describe('nightsBetween', () => {
  it('counts nights without including the check-out day', () => {
    expect(nightsBetween('2026-11-01', '2026-11-03')).toBe(2);
  });

  it('returns 0 for a same-day stay', () => {
    expect(nightsBetween('2026-11-01', '2026-11-01')).toBe(0);
  });

  it('counts across month boundaries', () => {
    expect(nightsBetween('2026-01-30', '2026-02-02')).toBe(3);
  });
});

describe('formatDisplayDate', () => {
  it('renders a short human date', () => {
    expect(formatDisplayDate('2026-10-10')).toBe('10 Oct 2026');
  });
});

describe('formatStayRange', () => {
  it('joins both dates with an em dash', () => {
    expect(formatStayRange('2026-10-10', '2026-10-15')).toBe('10 Oct 2026 \u2014 15 Oct 2026');
  });
});

describe('addDaysISO', () => {
  it('adds days and keeps the yyyy-MM-dd shape', () => {
    expect(addDaysISO('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysISO('2026-10-10', -1)).toBe('2026-10-09');
  });
});

describe('computeDefaultCheckOut', () => {
  it('mirrors the check-in time and adds 24 hours per night', () => {
    expect(computeDefaultCheckOut('2026-11-01', '14:00', 1)).toEqual({
      checkOutDate: '2026-11-02',
      checkOutTime: '14:00',
    });
    expect(computeDefaultCheckOut('2026-11-01', '14:00', 3)).toEqual({
      checkOutDate: '2026-11-04',
      checkOutTime: '14:00',
    });
  });

  it('clamps non-positive or malformed nights to a single night', () => {
    expect(computeDefaultCheckOut('2026-11-01', '14:00', 0).checkOutDate).toBe('2026-11-02');
    expect(computeDefaultCheckOut('2026-11-01', '14:00', -3).checkOutDate).toBe('2026-11-02');
    expect(computeDefaultCheckOut('2026-11-01', '14:00', Number.NaN).checkOutDate).toBe('2026-11-02');
  });

  it('normalises single-digit check-in times', () => {
    expect(computeDefaultCheckOut('2026-11-01', '9:05', 1).checkOutTime).toBe('09:05');
  });
});

describe('sortDatesDescending', () => {
  it('orders newest first without mutating the input', () => {
    const input = ['2026-10-01', '2026-12-01', '2026-11-01'];
    expect(sortDatesDescending(input)).toEqual(['2026-12-01', '2026-11-01', '2026-10-01']);
    expect(input).toEqual(['2026-10-01', '2026-12-01', '2026-11-01']);
  });
});

describe('scheduledCheckOutMoment', () => {
  it('reads the check-out time in Africa/Lagos (UTC+1)', () => {
    expect(scheduledCheckOutMoment('2026-10-15', '12:00').toISOString()).toBe('2026-10-15T11:00:00.000Z');
  });

  it('falls back to 12:00 when the time is malformed', () => {
    expect(scheduledCheckOutMoment('2026-10-15', 'noon').toISOString()).toBe('2026-10-15T11:00:00.000Z');
  });
});

describe('isEarlyCheckOut', () => {
  it('is true before the scheduled moment', () => {
    expect(isEarlyCheckOut('2026-10-15', '12:00', new Date('2026-10-15T10:00:00Z'))).toBe(true);
  });

  it('is false at or after the scheduled moment', () => {
    expect(isEarlyCheckOut('2026-10-15', '12:00', new Date('2026-10-15T11:00:00Z'))).toBe(false);
    expect(isEarlyCheckOut('2026-10-15', '12:00', new Date('2026-10-15T12:00:00Z'))).toBe(false);
  });
});

describe('normaliseTime', () => {
  it('normalises single-digit hours and trims seconds', () => {
    expect(normaliseTime('9:05')).toBe('09:05');
    expect(normaliseTime('14:00:00')).toBe('14:00');
  });

  it('returns null for junk or out-of-range values', () => {
    expect(normaliseTime('noon')).toBeNull();
    expect(normaliseTime('25:00')).toBeNull();
    expect(normaliseTime('')).toBeNull();
    expect(normaliseTime(null)).toBeNull();
  });
});

describe('formatTime12h', () => {
  it('renders a 12-hour clock label', () => {
    expect(formatTime12h('14:00')).toBe('2:00 PM');
    expect(formatTime12h('00:30')).toBe('12:30 AM');
  });

  it('returns blank for missing and passes unparseable through', () => {
    expect(formatTime12h(null)).toBe('');
    expect(formatTime12h('noon')).toBe('noon');
  });
});

describe('timeToMinutes / minutesToTime', () => {
  it('round-trips minutes and wraps', () => {
    expect(timeToMinutes('02:30')).toBe(150);
    expect(minutesToTime(150)).toBe('02:30');
    expect(minutesToTime(1440)).toBe('00:00');
  });
});

describe('isOnSlotGrid / withinTimeRange', () => {
  it('checks grid alignment', () => {
    expect(isOnSlotGrid('14:30', 30)).toBe(true);
    expect(isOnSlotGrid('14:15', 30)).toBe(false);
  });

  it('checks inclusive windows', () => {
    expect(withinTimeRange('08:00', '08:00', '22:00')).toBe(true);
    expect(withinTimeRange('22:00', '08:00', '22:00')).toBe(true);
    expect(withinTimeRange('22:30', '08:00', '22:00')).toBe(false);
  });
});

describe('timeSlots', () => {
  it('lists grid slots within the window inclusive', () => {
    expect(timeSlots('08:00', '09:00', 30)).toEqual(['08:00', '08:30', '09:00']);
  });

  it('returns an empty list when the window is inverted', () => {
    expect(timeSlots('09:00', '08:00', 30)).toEqual([]);
  });
});

describe('floorToSlot', () => {
  it('rounds down to the previous boundary', () => {
    expect(floorToSlot('14:07', 30)).toBe('14:00');
    expect(floorToSlot('14:59', 30)).toBe('14:30');
  });
});

describe('lagosNow / lagosDateTimeISO / formatInstant', () => {
  it('reads the wall clock in Africa/Lagos', () => {
    expect(lagosNow(new Date('2026-10-13T13:30:00Z'))).toEqual({ date: '2026-10-13', time: '14:30' });
  });

  it('builds a Lagos-local instant with the +01:00 offset', () => {
    expect(lagosDateTimeISO('2026-10-13', '14:00')).toBe('2026-10-13T14:00:00+01:00');
  });

  it('formats an instant in Lagos time', () => {
    expect(formatInstant('2026-10-13T14:00:00+01:00')).toBe('13 Oct 2026, 2:00 pm');
    expect(formatInstant('2026-10-13T14:00:00+01:00', { date: false, time: true })).toBe('2:00 pm');
  });
});

describe('validateStayWindow', () => {
  const base = { checkInDate: '2026-11-01', checkInTime: '14:00', checkOutDate: '2026-11-03', checkOutTime: '12:00' };

  it('accepts a valid window', () => {
    expect(validateStayWindow(base, POLICY, { now: new Date('2026-10-01T00:00:00Z') })).toBeNull();
  });

  it('rejects a check-out that is not after check-in', () => {
    expect(validateStayWindow({ ...base, checkOutDate: '2026-11-01' }, POLICY)?.code).toBe('stay.invalid_range');
  });

  it('rejects off-grid times', () => {
    expect(validateStayWindow({ ...base, checkInTime: '14:15' }, POLICY)?.code).toBe('stay.time_not_allowed');
  });

  it('rejects times outside the allowed window', () => {
    expect(validateStayWindow({ ...base, checkInTime: '23:00' }, POLICY)?.code).toBe('stay.time_not_allowed');
  });

  it('accepts a stay longer than nights allow because of late checkout surcharge', () => {
    const error = validateStayWindow(
      { ...base, checkInTime: '08:00', checkOutDate: '2026-11-04', checkOutTime: '14:00' },
      POLICY,
      { now: new Date('2026-10-01T00:00:00Z') },
    );
    expect(error).toBeNull();
  });

  it('rejects a past check-in', () => {
    const now = new Date('2026-12-01T00:00:00Z');
    expect(validateStayWindow(base, POLICY, { now })?.code).toBe('stay.in_the_past');
  });
});

describe('check-in defaults and selectable slots', () => {
  it('rounds the next slot UP, never the current one', () => {
    expect(nextCheckInSlot('11:00', '08:00', '22:00', 30)).toBe('11:30');
    expect(nextCheckInSlot('11:10', '08:00', '22:00', 30)).toBe('11:30');
    expect(nextCheckInSlot('11:40', '08:00', '22:00', 30)).toBe('12:00');
    expect(nextCheckInSlot('13:00', '08:00', '22:00', 30)).toBe('13:30');
  });

  it('clamps the next slot up to the earliest window', () => {
    expect(nextCheckInSlot('06:00', '08:00', '22:00', 30)).toBe('08:00');
  });

  it('returns null when no slot remains today', () => {
    expect(nextCheckInSlot('22:00', '08:00', '22:00', 30)).toBeNull();
    expect(nextCheckInSlot('23:30', '08:00', '22:00', 30)).toBeNull();
  });

  it('defaults to the next slot today, or tomorrow earliest when the day is over', () => {
    const window = { earliestCheckInTime: '08:00', latestCheckInTime: '22:00', timeSlotMinutes: 30 };
    expect(defaultCheckIn({ date: '2026-11-01', time: '11:10' }, window)).toEqual({ date: '2026-11-01', time: '11:30' });
    expect(defaultCheckIn({ date: '2026-11-01', time: '22:00' }, window)).toEqual({ date: '2026-11-02', time: '08:00' });
  });

  it('only enables today slots strictly after now', () => {
    expect(isCheckInSlotSelectable('11:30', true, '11:00', '08:00', '22:00')).toBe(true);
    expect(isCheckInSlotSelectable('11:00', true, '11:00', '08:00', '22:00')).toBe(false);
    expect(isCheckInSlotSelectable('10:30', true, '11:00', '08:00', '22:00')).toBe(false);
    expect(isCheckInSlotSelectable('08:00', false, '11:00', '08:00', '22:00')).toBe(true);
    expect(isCheckInSlotSelectable('07:00', false, '11:00', '08:00', '22:00')).toBe(false);
  });
});
