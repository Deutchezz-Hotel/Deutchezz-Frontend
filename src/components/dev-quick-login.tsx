import { useMocks } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function DevQuickLogin() {
  const nav = useNavigate();
  const { user, refetch } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  if (!useMocks) return null;
  if (user) return null;

  const seed = async (email: string, password: string) => {
    setLoggingIn(true);
    try {
      const { authStorage: store, services } = await import('@/api');
      const res = await services.auth.login({ email, password });
      store.setAccessToken(res.accessToken);
      store.setRefreshToken(res.refreshToken);
      await refetch();
      const role = res.user.role;
      if (role === 'Administrator') nav('/admin');
      else if (role === 'Receptionist') nav('/reception');
      else nav('/dashboard');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Mock quick login</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={loggingIn} onClick={() => seed('admin@demo.com', 'demo1234')}>Admin</Button>
        <Button variant="outline" disabled={loggingIn} onClick={() => seed('reception@demo.com', 'demo1234')}>Reception</Button>
        <Button variant="outline" disabled={loggingIn} onClick={() => seed('grace@example.com', 'demo1234')}>Customer</Button>
      </CardContent>
    </Card>
  );
}