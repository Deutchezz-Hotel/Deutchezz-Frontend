import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBookingLookup } from '@/hooks/queries';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/api/problem';
import { appConfig } from '@/config/appConfig';
import { useState } from 'react';

const schema = z.object({
  bookingReference: z.string().min(6, 'Enter your booking reference'),
  email: z.string().email('Enter the email used for the booking'),
});
type FormValues = z.infer<typeof schema>;

export default function LookupPage() {
  const lookup = useBookingLookup();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bookingReference: params.get('bookingReference') ?? '', email: '' },
  });

  return (
    <>
      <PageHero
        eyebrow="Your stay, close at hand"
        title={<>Find your <em className="italic">booking.</em></>}
        description="Enter the reference from your confirmation email along with the email address used to make the reservation."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-xl">
          <CardContent className="space-y-6 p-8">
            <Form {...form}>
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit((v) => {
                  setError(null);
                  setRateLimited(false);
                  lookup.mutate(v, {
                    onSuccess: (booking) => {
                      sessionStorage.setItem(`deutchezz.confirmation.${booking.bookingReference}`, JSON.stringify(booking));
                      nav(`/booking/confirmation/${booking.bookingReference}`, { state: booking });
                    },
                    onError: (e) => {
                      const err = e as ApiError;
                      if (err.status === 429) {
                        setRateLimited(true);
                        setError('Too many attempts, please wait a moment.');
                      } else {
                        setError('We could not find a booking with those details');
                      }
                    },
                  });
                })}
              >
                <FormField
                  control={form.control}
                  name="bookingReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking reference</FormLabel>
                      <FormControl><Input placeholder="DHI-2026-XXXXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={lookup.isPending || rateLimited}>
                  {lookup.isPending ? 'Searching…' : 'Find my booking'}
                </Button>
              </form>
            </Form>
            <p className="border-t pt-4 text-sm text-ink-600">
              Once found, you can view the details or cancel the booking using your reference and email. For anything else, contact the hotel on {appConfig.phoneNumber}.
            </p>
          </CardContent>
        </Card>
        </Reveal>
      </section>
    </>
  );
}
