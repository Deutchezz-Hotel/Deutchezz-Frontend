import type { BookingFlowState } from '@/features/booking/types';

/** Router state handed to /verify-email after a registration attempt. */
export interface VerifyEmailState {
  email: string;
  /** Seconds before a new code may be requested (from the 202 body). */
  resendAvailableInSeconds: number;
  /** Where to go after a successful verification. Defaults to the dashboard. */
  returnTo?: string;
  /** Optional router state to restore alongside `returnTo` (e.g. the booking flow). */
  returnState?: unknown;
}

/** Router state handed to /reset-password after requesting a reset code. */
export interface ResetPasswordState {
  email: string;
  resendAvailableInSeconds: number;
}

export const DEFAULT_CUSTOMER_HOME = '/dashboard';

/**
 * Builds the /verify-email state for a fresh registration. When the visitor
 * arrived from the booking flow, the flow is carried through so verification
 * lands back on the review step instead of losing their in-progress booking.
 * The email is passed via router state (never localStorage).
 */
export function verifyStateFor(
  email: string,
  resendAvailableInSeconds: number,
  bookingFlow?: BookingFlowState,
): VerifyEmailState {
  if (bookingFlow) {
    return {
      email,
      resendAvailableInSeconds,
      returnTo: '/booking/review',
      returnState: bookingFlow,
    };
  }
  return { email, resendAvailableInSeconds };
}
