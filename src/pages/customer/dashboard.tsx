import { useAuth } from '@/app/auth';
import { useMeBookings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { Link } from 'react-router-dom';
import { CalendarDays, CalendarPlus, Search, Sparkles, ArrowRight } from 'lucide-react';
import type { BookingListItem } from '@/types';

function nextUpcoming(items: BookingListItem[]): BookingListItem | null {
  const active = items.filter((b) => b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'CheckedIn');
  if (active.length === 0) return null;
  return active.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0];
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const bookingsQuery = useMeBookings({ pageSize: 100 });

  const bookings = bookingsQuery.data?.items ?? [];
  const upcoming = nextUpcoming(bookings);
  const upcomingNights = upcoming ? upcoming.nights : 0;
  const totalStays = bookings.filter((b) => b.status !== 'Cancelled').length;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
        <p className="text-sm opacity-80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
        </h1>
        <p className="mt-1 text-sm opacity-80">A little rest goes a long way.</p>
      </div>

      {bookingsQuery.isLoading ? <PageSkeleton rows={4} /> : null}
      {bookingsQuery.isError ? <ErrorBanner message="We couldn't load your bookings" retry={() => bookingsQuery.refetch()} /> : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-ink-600">Next stay</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming ? (
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-ink-900">{upcoming.bookingReference}</p>
                    <p className="text-sm text-ink-600">{formatStayRange(upcoming.checkInDate, upcoming.checkOutDate)}</p>
                    <p className="text-sm text-ink-600">{upcomingNights} {upcomingNights === 1 ? 'night' : 'nights'} · {formatMoney(upcoming.totalAmount)}</p>
                    <Badge variant="secondary" className="mt-2">{bookingStatusLabel(upcoming.status)}</Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-600">No upcoming stays.</p>
                    <Button asChild size="sm"><Link to="/book">Plan a stay</Link></Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-ink-600">Total stays</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-ink-900">{totalStays}</p>
                <p className="text-sm text-ink-600">{bookings.length} bookings on file</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-ink-600">Payment on your next stay</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming ? (
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-ink-900">{paymentStatusLabel(upcoming.paymentStatus)}</p>
                    <p className="text-sm text-ink-600">Pay at the hotel on arrival</p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-600">No bookings to show.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-milk">
              <CardContent className="flex items-center gap-4 p-6">
                <CalendarPlus className="h-8 w-8 text-forest-700" />
                <div className="space-y-1">
                  <p className="font-medium text-ink-900">Book a room</p>
                  <p className="text-sm text-ink-600">Check availability and reserve</p>
                  <Link to="/book" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">Start now <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-milk">
              <CardContent className="flex items-center gap-4 p-6">
                <Search className="h-8 w-8 text-forest-700" />
                <div className="space-y-1">
                  <p className="font-medium text-ink-900">Find a booking</p>
                  <p className="text-sm text-ink-600">Look up a reservation by reference</p>
                  <Link to="/my-booking" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">Search <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-milk">
              <CardContent className="flex items-center gap-4 p-6">
                <CalendarDays className="h-8 w-8 text-forest-700" />
                <div className="space-y-1">
                  <p className="font-medium text-ink-900">My bookings</p>
                  <p className="text-sm text-ink-600">See all of your reservations</p>
                  <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-ink-600">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
            <p>To change or cancel an existing booking, contact the hotel — changes aren&apos;t yet available online.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}