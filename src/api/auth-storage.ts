/**
 * Auth token storage.
 *
 * The access token lives in memory only; the refresh token is persisted to
 * localStorage so the session survives reloads.
 *
 * HARDENING NOTE: moving the refresh token to an httpOnly, Secure, SameSite
 * cookie issued by the backend removes XSS exposure. The storage module is the
 * single place to change when that lands.
 */

const ACCESS_KEY = 'deutchezz.access';
const REFRESH_KEY = 'deutchezz.refresh';

let accessToken: string | null = null;

export const authStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string): void {
    accessToken = token;
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_KEY, token);
    } catch {
      /* storage unavailable — session simply won't survive reloads */
    }
  },
  /** Legacy/mock session marker key; present when a mock session is active. */
  setSession(userId: string): void {
    try {
      localStorage.setItem(ACCESS_KEY, `mock.${userId}`);
    } catch {
      /* noop */
    }
  },
  getSessionUserId(): string | null {
    const raw = accessToken ?? localStorage.getItem(ACCESS_KEY);
    if (!raw) return null;
    return raw.startsWith('mock.') ? raw.slice(5) : null;
  },
  clear(): void {
    accessToken = null;
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* noop */
    }
  },
};