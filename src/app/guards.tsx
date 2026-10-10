import { Suspense, type ComponentType, type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@/types';
import { useAuth } from './auth';

export function RequireAuth({ allowedRoles, redirectTo = '/login' }: { allowedRoles?: UserRole[]; redirectTo?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <PageLoader label="Checking your access..." />;
  }
  if (!user) return <Navigate to={redirectTo} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function withSuspense(Component: ComponentType) {
  return function Wrapped() {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    );
  };
}

export function PageLoader({ label = 'Loading...' }: { label?: ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">{label}</div>;
}