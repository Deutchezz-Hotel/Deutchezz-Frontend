import { useState } from 'react';
import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResetPassword } from '@/hooks/queries';
import { friendlyCodeError } from '@/api/problem';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ResetPasswordState } from '@/features/auth/flow';

const schema = z
  .object({
    email: z.string().trim().email('Enter a valid email address'),
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(8, 'Use at least 8 characters'),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function ResetPasswordPage() {
  const location = useLocation();
  const state = location.state as ResetPasswordState | null;
  const nav = useNavigate();
  const reset = useResetPassword();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: state?.email ?? '', code: '', newPassword: '', confirm: '' },
  });
  const [code, setCode] = useState('');
  const error = friendlyCodeError(reset.error);

  const submit = form.handleSubmit((v) => {
    reset.mutate(
      { email: v.email, code: v.code, newPassword: v.newPassword },
      {
        onSuccess: () => {
          toast.success('Your password has been reset. Please sign in.');
          nav('/login', { replace: true });
        },
      },
    );
  });

  return (
    <>
      <PageHero
        eyebrow="Account help"
        title={<>Choose a <em className="italic">new password</em></>}
        description="Enter the code we emailed you, then set a new password."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-lg">
            <CardContent className="space-y-6 p-8">
              {state?.email ? (
                <Alert>
                  <AlertDescription>
                    If an account exists for {state.email}, we've emailed a reset code. It expires shortly.
                  </AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Form {...form}>
                <form className="space-y-4" onSubmit={submit}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="reset-otp">Reset code</FormLabel>
                        <FormControl>
                          <InputOTP
                            id="reset-otp"
                            value={code}
                            onChange={(value) => {
                              setCode(value);
                              field.onChange(value);
                            }}
                            onBlur={field.onBlur}
                            maxLength={6}
                            containerClassName="justify-center"
                          >
                            <InputOTPGroup>
                              {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot key={index} index={index} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm new password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={reset.isPending}>
                    {reset.isPending ? 'Resetting…' : 'Reset password'}
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
                {' · '}
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Request a new code
                </Link>
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
