import { LoginForm } from '@/features/auth/components/login-form';
import { useLogin } from '@/hooks/queries';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/auth';
import { useEffect } from 'react';
import { DevQuickLogin } from '@/components/dev-quick-login';
import type { BookingFlowState } from '@/features/booking/types';

export default function LoginPage() {
  const login = useLogin();
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const { user } = useAuth();

  const goAfterAuth = (role: string) => {
    if (flow) nav('/booking/review', { state: flow, replace: true });
    else if (role === 'Administrator') nav('/admin', { replace: true });
    else if (role === 'Receptionist') nav('/reception', { replace: true });
    else nav('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (user && !flow) goAfterAuth(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, flow, nav]);

  return (
    <div className="section-pad container-x">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm
            loading={login.isPending}
            onSubmit={(v) =>
              login.mutate(v, {
                onSuccess: (data) => goAfterAuth(data.user.role),
              })
            }
          />
          <p className="text-center text-sm text-ink-600">
            No account yet? <Link to="/register" className="text-forest-700 hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
      <div className="mt-8">
        <DevQuickLogin />
      </div>
    </div>
  );
}
