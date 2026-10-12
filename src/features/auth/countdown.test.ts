import { describe, expect, it } from 'vitest';
import { digitsOnly, formatCountdown, isCompleteCode, tickCountdown } from './countdown';

describe('tickCountdown', () => {
  it('decrements by one second', () => {
    expect(tickCountdown(60)).toBe(59);
  });

  it('never goes below zero', () => {
    expect(tickCountdown(0)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats seconds with a zero-padded remainder', () => {
    expect(formatCountdown(125)).toBe('2:05');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(9)).toBe('0:09');
  });

  it('clamps negatives to zero', () => {
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('isCompleteCode', () => {
  it('accepts exactly six digits', () => {
    expect(isCompleteCode('123456')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('1234567')).toBe(false);
    expect(isCompleteCode('12a456')).toBe(false);
    expect(isCompleteCode('')).toBe(false);
  });
});

describe('digitsOnly', () => {
  it('removes separators and caps at six digits', () => {
    expect(digitsOnly('123 456')).toBe('123456');
    expect(digitsOnly('12-34-56-78')).toBe('123456');
    expect(digitsOnly('abc')).toBe('');
  });
});
