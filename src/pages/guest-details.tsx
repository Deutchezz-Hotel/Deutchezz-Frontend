import { PageHero } from '@/components/branding';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import type { BookingFlowState } from '@/features/booking/types';
import { useEffect } from 'react';
import { useAuth } from '@/app/auth';

const schema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName: z.string().min(2, 'Enter your last name'),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(8, 'Enter a valid phone number'),
  specialRequests: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function GuestDetailsPage() {
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      specialRequests: '',
    },
  });

  useEffect(() => {
    if (!flow) nav('/book', { replace: true });
  }, [flow, nav]);

  if (!flow) return null;

  return (
    <>
      <PageHero
        eyebrow="Almost there"
        title={<>Tell us a little <em className="font-serif italic">about yourself.</em></>}
        description="We'll use these details to prepare your arrival and send your confirmation."
      />
      <section className="section-pad container-x">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-10">
            <Form {...form}>
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit((v) => {
                  const draft = {
                    ...flow.draft,
                    request: {
                      ...flow.draft.request,
                      guest: {
                        firstName: v.firstName.trim(),
                        lastName: v.lastName.trim(),
                        email: v.email.trim(),
                        phoneNumber: v.phoneNumber.trim(),
                      },
                      specialRequests: v.specialRequests?.trim().length ? v.specialRequests.trim() : null,
                    },
                  };
                  nav('/booking/review', { state: { draft, idempotencyKey: flow.idempotencyKey } });
                })}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl><Input autoComplete="given-name" {...field} /></FormControl>
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
                        <FormControl><Input autoComplete="family-name" {...field} /></FormControl>
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
                      <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl><Input autoComplete="tel" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special requests (optional)</FormLabel>
                      <FormControl><Textarea rows={4} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Review reservation</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
