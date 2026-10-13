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
  clear(): void {
    accessToken = null;
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* noop */
    }
  },
};