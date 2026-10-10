import { Outlet } from 'react-router-dom';
import { PublicLayout } from '@/layouts/public-layout';

export function PublicShell() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}