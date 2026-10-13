/**
 * Pure helpers behind the OTP/resend UI. Kept side-effect free so they can be
 * unit-tested without a DOM (the test environment is `node`).
 */

export const OTP_LENGTH = 6;

/** One second tick: never drops below zero. */
export function tickCountdown(seconds: number): number {
  return seconds > 0 ? seconds - 1 : 0;
}

/** "125" -> "2:05"; negative input clamps to "0:00". */
export function formatCountdown(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

/** True only for exactly six digits. */
export function isCompleteCode(value: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}

/** Strips non-digits and caps the value at the OTP length. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}
