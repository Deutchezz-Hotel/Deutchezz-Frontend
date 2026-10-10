/**
 * Mock auth adapter. Behaves like the real backend: register/logout handling,
 * token issuance (fake opaque tokens carrying the user id) and /auth/me.
 */
import { ApiError } from '@/api/problem';
import { authStorage } from '@/api/auth-storage';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';
import { initialsOf } from '@/lib/id';
import { readDb, writeDb, type MockUser } from './db';
import { simulateLatency } from './latency';

function toUser(user: MockUser): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    initials: initialsOf(user.firstName, user.lastName),
  };
}

function issueAuth(user: MockUser): AuthResponse {
  const accessToken = `mock.${user.id}`;
  const refreshToken = `mock-refresh.${user.id}`;
  authStorage.setAccessToken(accessToken);
  authStorage.setRefreshToken(refreshToken);
  return { user: toUser(user), accessToken, refreshToken };
}

function currentUser(): MockUser | null {
  const userId = authStorage.getSessionUserId();
  if (!userId) return null;
  const db = readDb();
  return db.users.find((u) => u.id === userId) ?? null;
}

export const mockAuthApi = {
  async register(request: RegisterRequest): Promise<AuthResponse> {
    await simulateLatency();
    const db = readDb();
    const email = request.email.toLowerCase().trim();
    if (db.users.some((u) => u.email === email)) {
      throw new ApiError({ status: 409, title: 'Conflict', detail: 'An account with this email already exists', errors: { email: ['An account with this email already exists'] } });
    }
    const user: MockUser = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email,
      phoneNumber: request.phoneNumber?.trim() ?? '',
      password: request.password,
      role: 'Customer',
    };
    db.users.push(user);
    writeDb(db);
    return issueAuth(user);
  },

  async login(request: LoginRequest): Promise<AuthResponse> {
    await simulateLatency();
    const db = readDb();
    const email = request.email.toLowerCase().trim();
    const user = db.users.find((u) => u.email === email && u.password === request.password);
    if (!user) {
      throw new ApiError({ status: 401, title: 'Invalid credentials', detail: 'The email or password you entered is incorrect', errors: { email: ['Invalid email or password'], password: ['Invalid email or password'] } });
    }
    writeDb(db);
    return issueAuth(user);
  },

  async logout(): Promise<void> {
    await simulateLatency(100, 250);
    authStorage.clear();
  },

  async me(): Promise<User> {
    await simulateLatency();
    const user = currentUser();
    if (!user) {
      authStorage.clear();
      throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'Your session has expired. Please sign in again.' });
    }
    return toUser(user);
  },
};