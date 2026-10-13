import { useEffect, useRef, useState } from 'react';
import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';
import { useResendCode, useVerifyEmail } from '@/hooks/queries';
import { friendlyCodeError } from '@/api/problem';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CUSTOMER_HOME, type VerifyEmailState } from '@/features/auth/flow';
import { formatCountdown, isCompleteCode, tickCountdown } from '@/features/auth/countdown';

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyEmailState | null;
  const email = state?.email ?? '';

  const verify = useVerifyEmail();
  const resend = useResendCode();

  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(state?.resendAvailableInSeconds ?? 0);
  const [resent, setResent] = useState<string | null>(null);
  const submittedFor = useRef<string | null>(null);

  // Countdown for the resend button.
  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => tickCountdown(s)), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  // Clear the entered code when a verification attempt fails so the guest can retry.
  useEffect(() => {
    if (verify.isError) {
      setCode('');
      submittedFor.current = null;
    }
  }, [verify.isError]);

  // Once verified, continue to the booking flow (if any) or the dashboard.
  useEffect(() => {
    if (verify.isSuccess) {
      nav(state?.returnTo ?? DEFAULT_CUSTOMER_HOME, { state: state?.returnState, replace: true });
    }
  }, [verify.isSuccess, nav, state?.returnTo, state?.returnState]);

  const error = friendlyCodeError(verify.error);

  const submit = (value: string) => {
    if (!email || !isCompleteCode(value) || verify.isPending || submittedFor.current === value) return;
    submittedFor.current = value;
    verify.mutate({ email, code: value });
  };

  const onResend = () => {
    if (seconds > 0 || resend.isPending) return;
    resend.mutate(
      { email },
      {
        onSuccess: (data) => {
          setResent(data.message);
          setSeconds(data.resendAvailableInSeconds);
          submittedFor.current = null;
        },
      },
    );
  };

  if (!email) {
    return (
      <>
        <PageHero eyebrow="Account" title={<>Verify your <em className="italic">email</em></>} description="Confirm the code we emailed you to finish signing up." />
        <section className="section-pad container-x">
          <Reveal>
            <Card className="mx-auto max-w-lg">
              <CardContent className="space-y-6 p-8 text-center">
                <Alert variant="destructive">
                  <AlertDescription>We lost track of the email address to verify. Please sign up again.</AlertDescription>
                </Alert>
                <Button className="w-full" onClick={() => nav('/register')}>
                  Back to sign up
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Account" title={<>Verify your <em className="italic">email</em></>} description="Enter the 6-digit code we just sent you." />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-lg">
            <CardContent className="space-y-6 p-8">
              <p className="text-sm text-muted-foreground">
                We sent a code to <span className="font-medium text-foreground">{email}</span>.
              </p>

              {resent ? (
                <Alert>
                  <AlertDescription>{resent}</AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-3">
                <Label htmlFor="verify-otp">Verification code</Label>
                <InputOTP
                  id="verify-otp"
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    submit(value);
                  }}
                  maxLength={6}
                  disabled={verify.isPending}
                  autoFocus
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verify.isPending ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying…
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" disabled={seconds > 0 || resend.isPending} onClick={onResend}>
                  {seconds > 0 ? `Resend code in ${formatCountdown(seconds)}` : 'Resend code'}
                </Button>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Wrong email?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Use a different email
                </Link>
                {' · '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
