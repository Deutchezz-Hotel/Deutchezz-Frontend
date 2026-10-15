import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
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
import { formatStayRange, formatTime12h } from '@/lib/dates';
import { ArrowLeft } from 'lucide-react';

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
  const savedGuest = flow?.draft.request.guest;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: savedGuest?.firstName || user?.firstName || '',
      lastName: savedGuest?.lastName || user?.lastName || '',
      email: savedGuest?.email || user?.email || '',
      phoneNumber: savedGuest?.phoneNumber || user?.phoneNumber || '',
      specialRequests: flow?.draft.request.specialRequests ?? '',
    },
  });

  useEffect(() => {
    if (!flow) nav('/book', { replace: true });
  }, [flow, nav]);

  if (!flow) return null;

  const buildDraft = () => {
    const v = form.getValues();
    return {
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
  };

  const handleBack = () => {
    nav('/book', { state: { draft: buildDraft(), idempotencyKey: flow.idempotencyKey } });
  };

  return (
    <>
      <PageHero
        eyebrow="Almost there"
        title={<>Tell us a little <em className="italic">about yourself.</em></>}
        description="We'll use these details to prepare your arrival and send your confirmation."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-10">
            <div className="space-y-1 rounded-xl border border-border bg-accent/50 p-4 text-sm">
              <p className="font-medium text-foreground">{formatStayRange(flow.draft.request.checkInDate, flow.draft.request.checkOutDate)}</p>
              <p className="text-muted-foreground">{`Check-in ${formatTime12h(flow.draft.request.checkInTime)} · check-out ${formatTime12h(flow.draft.request.checkOutTime)}`}</p>
            </div>
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
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1">Review reservation</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        </Reveal>
      </section>
    </>
  );
}
