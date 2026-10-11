import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRegister } from '@/hooks/queries';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/app/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { friendlyAuthError } from '@/api/problem';
import type { BookingFlowState } from '@/features/booking/types';

const schema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(8),
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function RegisterPage() {
  const register = useRegister();
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const { user, refetch } = useAuth();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirm: '' } });

  useEffect(() => {
    if (!user) return;
    if (flow) nav('/booking/review', { state: flow, replace: true });
    else if (user.role === 'Administrator') nav('/admin', { replace: true });
    else if (user.role === 'Receptionist') nav('/reception', { replace: true });
    else nav('/dashboard', { replace: true });
  }, [user, flow, nav]);

  const registerError = friendlyAuthError(register.error);

  return (
    <>
      <PageHero eyebrow="Create your account" title={<>Join Deutchezz <em className="italic">Ispahan</em></>} description="Create an account to manage your reservations." />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-6 p-8">
            {registerError ? (
              <Alert variant="destructive">
                <AlertDescription>{registerError}</AlertDescription>
              </Alert>
            ) : null}
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((v) =>
                  register.mutate(
                    { firstName: v.firstName, lastName: v.lastName, email: v.email, phoneNumber: v.phoneNumber, password: v.password },
                    {
                      onSuccess: () => {
                        void refetch();
                      },
                    },
                  ),
                )}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                        <Input type="email" {...field} />
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
                        <Input {...field} />
                      </FormControl>
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
                          <Input type="password" {...field} />
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
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={register.isPending}>Create account</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        </Reveal>
      </section>
    </>
  );
}
