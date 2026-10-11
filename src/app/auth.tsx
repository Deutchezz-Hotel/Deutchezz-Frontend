import { useEffect, useState, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authStorage, services } from '@/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  rolesAllowed: (roles: User['role'][]) => boolean;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User | null> => {
      // Only hit the API when we might actually have a session. With a refresh
      // token but no access token (e.g. after a reload) the transport refreshes
      // automatically on the 401 and retries, restoring the session.
      const hasSession =
        !!authStorage.getAccessToken() ||
        !!authStorage.getRefreshToken() ||
        !!authStorage.getSessionUserId();
      if (!hasSession) return null;
      return services.auth.me();
    },
    retry: 1,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data]);

  useEffect(() => {
    if (query.error) {
      authStorage.clear();
      setUser(null);
    }
  }, [query.error]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: query.isLoading,
        isAuthenticated: !!user,
        rolesAllowed: (roles) => !!user && roles.includes(user.role),
        logout: async () => {
          try {
            await services.auth.logout();
          } catch {
            /* ignore */
          } finally {
            authStorage.clear();
            setUser(null);
            window.location.href = '/login';
          }
        },
        refetch: () => query.refetch(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}