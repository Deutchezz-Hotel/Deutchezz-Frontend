import { describe, expect, it } from 'vitest';
import { bookingOverageMinutes, extendedStayLabel, gracePeriodNote, isWithinGrace, overageHours, WITHIN_GRACE_NOTE } from './pricing';

const ISO = (s: string) => s;

function booking(checkInAt: string, checkOutAt: string, nights: number, actualCheckOutAt: string | null = null) {
  return { checkInAt, checkOutAt, nights, actualCheckOutAt };
}

describe('bookingOverageMinutes', () => {
  it('is zero for an on-time stay of whole nights', () => {
    expect(bookingOverageMinutes(booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-02T14:00:00+01:00'), 1))).toBe(0);
  });

  it('counts whole minutes beyond the booked nights', () => {
    expect(bookingOverageMinutes(booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-02T17:00:00+01:00'), 1))).toBe(180);
  });

  it('floors partial minutes', () => {
    expect(bookingOverageMinutes(booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-02T17:00:59+01:00'), 1))).toBe(180);
  });

  it('uses the actual check-out instant when the guest has left', () => {
    const b = booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-02T15:00:00+01:00'), 1, ISO('2026-03-02T19:30:00+01:00'));
    expect(bookingOverageMinutes(b)).toBe(330);
  });

  it('never returns a negative overage for a short stay', () => {
    expect(bookingOverageMinutes(booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-02T12:00:00+01:00'), 1))).toBe(0);
  });

  it('handles multi-night stays', () => {
    expect(bookingOverageMinutes(booking(ISO('2026-03-01T14:00:00+01:00'), ISO('2026-03-04T16:00:00+01:00'), 3))).toBe(120);
  });
});

describe('overageHours / extendedStayLabel', () => {
  it('renders whole hours without a decimal', () => {
    expect(overageHours(180)).toBe(3);
    expect(extendedStayLabel(180)).toBe('Extended stay (3 hrs beyond 24 hrs)');
  });

  it('renders half hours for odd minutes', () => {
    expect(overageHours(210)).toBe(3.5);
    expect(extendedStayLabel(210)).toBe('Extended stay (3.5 hrs beyond 24 hrs)');
  });
});

describe('isWithinGrace / gracePeriodNote', () => {
  it('treats exactly the grace boundary as within grace', () => {
    expect(isWithinGrace(120, 2)).toBe(true);
    expect(isWithinGrace(121, 2)).toBe(false);
  });

  it('never reports zero overage as within grace', () => {
    expect(isWithinGrace(0, 2)).toBe(false);
  });

  it('builds the note from the settings value', () => {
    expect(gracePeriodNote(2)).toBe(
      'Extra charges apply for time beyond 24 hours. The first 2 hours are a free grace period, so charges start after 26 hours.',
    );
    expect(gracePeriodNote(3)).toContain('first 3 hours');
    expect(gracePeriodNote(3)).toContain('after 27 hours');
  });

  it('exposes the within-grace note', () => {
    expect(WITHIN_GRACE_NOTE).toBe('Within the free grace period');
  });
});
