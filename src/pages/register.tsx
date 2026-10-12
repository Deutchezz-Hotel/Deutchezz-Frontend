import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRegister } from '@/hooks/queries';
import { useNavigate, useLocation } from 'react-router-dom';
import { authCodeField, friendlyAuthError, isApiError } from '@/api/problem';
import { verifyStateFor } from '@/features/auth/flow';
import type { BookingFlowState } from '@/features/booking/types';

const schema = z
  .object({
    firstName: z.string().trim().min(2, 'Enter your first name'),
    lastName: z.string().trim().min(2, 'Enter your last name'),
    email: z.string().trim().email('Enter a valid email address'),
    phoneNumber: z.string().trim().regex(/^\+?[\d\s()-]{8,20}$/, 'Enter a valid phone number'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(8, 'Use at least 8 characters'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function RegisterPage() {
  const register = useRegister();
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirm: '' },
  });

  const submit = form.handleSubmit((v) => {
    register.mutate(
      { firstName: v.firstName, lastName: v.lastName, email: v.email, phoneNumber: v.phoneNumber, password: v.password },
      {
        onSuccess: (data) => {
          // No session yet: the backend replied 202 and emailed a 6-digit code.
          nav('/verify-email', {
            state: verifyStateFor(v.email, data.resendAvailableInSeconds, flow),
          });
        },
        onError: (error) => {
          const code = isApiError(error) ? error.problem.code : undefined;
          const field = authCodeField(code);
          if (field === 'phoneNumber') {
            form.setError('phoneNumber', { message: isApiError(error) ? error.problem.detail : undefined });
          }
        },
      },
    );
  });

  const code = isApiError(register.error) ? register.error.problem.code : undefined;
  const showBanner = Boolean(register.error) && !authCodeField(code);
  const errorMessage = showBanner ? friendlyAuthError(register.error) : null;

  return (
    <>
      <PageHero eyebrow="Create your account" title={<>Join Deutchezz <em className="italic">Ispahan</em></>} description="Create an account to manage your reservations." />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-6 p-8">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
            <Form {...form}>
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" {...field} />
                      </FormControl>
                      <FormDescription>e.g. 0803 123 4567 or +234 803 123 4567</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={register.isPending}>
                  {register.isPending ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        </Reveal>
      </section>
    </>
  );
}
