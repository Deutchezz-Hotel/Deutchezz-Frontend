/**
 * RFC 7807 Problem Details error mapping.
 *
 * The backend reports errors as { type, title, status, detail, instance, errors }.
 * Validation failures arrive as `errors` with field -> message[] entries which we
 * map onto react-hook-form fields.
 */

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Machine-readable error code from the backend (ProblemDetails extension). */
  code?: string;
  errors?: Record<string, string[]>;
  /* --- Extra extension fields (e.g. the duplicate-booking warning, 7m) --- */
  /** Whole minutes since the likely-duplicate booking was created. */
  minutesAgo?: number;
  /** Booking reference of the likely duplicate (masked for anonymous guests). */
  reference?: string;
  /** Id of the likely duplicate; only sent to authenticated callers. */
  bookingId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;
  readonly retryAfterSeconds?: number;

  constructor(problem: ProblemDetails, retryAfterSeconds?: number) {
    super(problem.detail ?? problem.title ?? 'Request failed');
    this.name = 'ApiError';
    this.status = problem.status;
    this.problem = problem;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** Validation errors keyed by field name (for react-hook-form setError). */
  get fieldErrors(): Record<string, string[]> {
    return this.problem.errors ?? {};
  }

  /** A friendly, single sentence shown in toasts/banners. */
  get userMessage(): string {
    const s = this.status;
    if (s === 409) {
      return this.problem.detail ?? 'These rooms are no longer available for your dates';
    }
    if (s === 429) {
      return 'Too many attempts, please wait a moment';
    }
    if (s === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (s === 403) {
      return "You don't have permission to do that.";
    }
    if (this.problem.detail) {
      return this.problem.detail;
    }
    if (this.problem.title) {
      return this.problem.title;
    }
    return 'Something went wrong. Please try again.';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiError(error: unknown): ApiError {
  return isApiError(error) ? error : new ApiError({ status: 0, title: 'Network error' });
}

export function isValidationError(error: unknown): error is ApiError & { status: 400 } {
  return isApiError(error) && error.status === 400 && Object.keys(error.fieldErrors).length > 0;
}

/** User-facing message for sign-in / sign-up failures (401 = bad credentials). */
export function friendlyAuthError(error: unknown): string | null {
  if (!error) return null;
  if (isApiError(error)) {
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status === 400) return error.problem.detail ?? 'Please check the details and try again.';
    return error.userMessage;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * User-facing message for one-time code entry (verify email / reset password).
 * Kept deliberately vague so an incorrect code is indistinguishable from an
 * expired or unknown one (no account enumeration).
 */
export function friendlyCodeError(error: unknown): string | null {
  if (!error) return null;
  if (isApiError(error)) {
    if (error.problem.code === 'auth.invalid_or_expired_code') {
      return 'That code is incorrect or has expired. Request a new code and try again.';
    }
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status === 400) return error.problem.detail ?? 'Please check the code and try again.';
    return error.userMessage;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Maps a backend auth error code to the form field it belongs to, so the UI can
 * surface it inline instead of only in a banner.
 */
export function authCodeField(code: string | undefined): 'email' | 'phoneNumber' | null {
  switch (code) {
    case 'auth.phone_in_use':
    case 'auth.invalid_phone':
      return 'phoneNumber';
    case 'auth.email_in_use':
      return 'email';
    default:
      return null;
  }
}