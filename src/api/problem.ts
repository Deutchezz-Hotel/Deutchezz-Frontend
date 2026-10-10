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
  errors?: Record<string, string[]>;
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
      return 'These rooms are no longer available for your dates';
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