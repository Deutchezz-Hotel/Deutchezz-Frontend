import { describe, expect, it } from 'vitest';
import { bookingStatusLabel, formatCompactMoney, formatMoney, paymentMethodLabel, roomStatusLabel } from './format';

describe('formatMoney', () => {
  it('omits decimals for whole naira amounts', () => {
    const formatted = formatMoney(1500);
    expect(formatted).toContain('1,500');
    expect(formatted).not.toContain('.');
  });

  it('keeps two decimals for partial amounts', () => {
    expect(formatMoney(1500.5)).toContain('1,500.50');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0');
  });
});

describe('formatCompactMoney', () => {
  it('abbreviates millions', () => {
    expect(formatCompactMoney(1_500_000)).toBe('\u20a61.5M');
  });

  it('abbreviates thousands', () => {
    expect(formatCompactMoney(250_000)).toBe('\u20a6250k');
  });

  it('falls back to the full format below a thousand', () => {
    expect(formatCompactMoney(500)).toBe(formatMoney(500));
  });
});

describe('friendly labels', () => {
  it('never leaks raw booking enums', () => {
    expect(bookingStatusLabel('CheckedIn')).toBe('Checked in');
    expect(bookingStatusLabel('CheckedOut')).toBe('Checked out');
  });

  it('labels room statuses', () => {
    expect(roomStatusLabel('Maintenance')).toBe('Maintenance');
  });

  it('labels payment methods', () => {
    expect(paymentMethodLabel('BankTransfer')).toBe('Bank transfer');
  });
});
