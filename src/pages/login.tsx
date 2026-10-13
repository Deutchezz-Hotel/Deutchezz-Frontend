import { LoginForm } from '@/features/auth/components/login-form';
import { Reveal } from '@/components/reveal';
import { useLogin } from '@/hooks/queries';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/auth';
import { useEffect } from 'react';
import type { BookingFlowState } from '@/features/booking/types';

export default function LoginPage() {
  const login = useLogin();
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const { user, refetch } = useAuth();

  const goAfterAuth = (role: string) => {
    if (flow) nav('/booking/review', { state: flow, replace: true });
    else if (role === 'Administrator') nav('/admin', { replace: true });
    else if (role === 'Receptionist') nav('/reception', { replace: true });
    else nav('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (user) goAfterAuth(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, flow, nav]);

  return (
    <div className="section-pad container-x">
      <Reveal>
        <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm
            loading={login.isPending}
            error={login.error}
            onSubmit={(v) =>
              login.mutate(v, {
                onSuccess: () => {
                  void refetch();
                },
              })
            }
          />
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot your password?</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            No account yet? <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
      </Reveal>
    </div>
  );
}
