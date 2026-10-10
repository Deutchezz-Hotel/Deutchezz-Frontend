import { ApiError } from '@/api/problem';
import { authStorage } from '@/api/auth-storage';
import { readDb, type MockDbData, type MockUser } from './db';

/** Resolve the signed-in mock user, or null when anonymous. */
export function currentMockUser(db: MockDbData = readDb()): MockUser | null {
  const userId = authStorage.getSessionUserId();
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}

/** Require a signed-in user, throwing 401 otherwise. */
export function requireMockUser(db: MockDbData = readDb()): MockUser {
  const user = currentMockUser(db);
  if (!user) {
    throw new ApiError({ status: 401, title: 'Unauthorized', detail: 'You must be signed in to continue' });
  }
  return user;
}

/** Require one of the given roles, throwing 403 otherwise. */
export function requireRole(roles: MockUser['role'][], db: MockDbData = readDb()): MockUser {
  const user = requireMockUser(db);
  if (!roles.includes(user.role)) {
    throw new ApiError({ status: 403, title: 'Forbidden', detail: "You don't have permission to do that." });
  }
  return user;
}