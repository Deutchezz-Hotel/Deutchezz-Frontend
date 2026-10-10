import { describe, expect, it } from 'vitest';
import { addDaysISO, formatDisplayDate, formatStayRange, nightsBetween, sortDatesDescending } from './dates';

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

describe('sortDatesDescending', () => {
  it('orders newest first without mutating the input', () => {
    const input = ['2026-10-01', '2026-12-01', '2026-11-01'];
    expect(sortDatesDescending(input)).toEqual(['2026-12-01', '2026-11-01', '2026-10-01']);
    expect(input).toEqual(['2026-10-01', '2026-12-01', '2026-11-01']);
  });
});
