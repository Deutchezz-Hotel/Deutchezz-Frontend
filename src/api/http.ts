/**
 * Typed fetch wrapper.
 *
 * - Base URL from VITE_API_URL.
 * - Injects the in-memory access token.
 * - Serialises/parses JSON.
 * - On 401 performs a single in-flight refresh via POST /auth/refresh and
 *   retries the original request once. Refresh failure logs the user out.
 * - Maps non-2xx bodies (RFC 7807 Problem Details) to ApiError, capturing
 *   Retry-After on 429 for honouring backoff.
 * - Carries an optional Idempotency-Key header (booking creation).
 */
import { ApiError, type ProblemDetails } from './problem';
import { authStorage } from './auth-storage';
import { env } from '@/config/env';

const BASE_URL: string = env.apiUrl;

export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Multipart payload; mutually exclusive with `body`. The browser sets the boundary header. */
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the Bearer header (public endpoints). Default false. */
  skipAuth?: boolean;
  /** Skip the automatic 401 refresh+retry (login/refresh themselves). */
  skipRefresh?: boolean;
  idempotencyKey?: string;
  /** Path relative to the API base, e.g. "/auth/login". */
  path: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    authStorage.clear();
    return false;
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      authStorage.clear();
      return false;
    }
    const data = (await res.json()) as RefreshResponse;
    authStorage.setAccessToken(data.accessToken);
    authStorage.setRefreshToken(data.refreshToken);
    return true;
  } catch {
    authStorage.clear();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function parseProblem(response: Response, retryAfter?: number): Promise<ApiError> {
  let problem: ProblemDetails;
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    problem = { status: response.status, title: response.statusText };
  }
  return new ApiError(problem, retryAfter);
}

async function rawFetch(options: HttpOptions): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  if (!options.skipAuth) {
    const token = authStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  return fetch(`${BASE_URL}${options.path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    signal: options.signal,
  });
}

export async function http<T>(options: HttpOptions): Promise<T> {
  let response = await rawFetch(options);

  if (response.status === 401 && !options.skipRefresh && !options.skipAuth) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await rawFetch(options);
    }
  }

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw await parseProblem(response, Number.isFinite(retryAfter) && retryAfter ? retryAfter : undefined);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}