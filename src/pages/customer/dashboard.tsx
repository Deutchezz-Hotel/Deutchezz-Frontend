import { useAuth } from '@/app/auth';
import { useMeBookings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RowLink } from '@/components/shared';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { bookingStatusTone } from '@/lib/status';
import { formatStayRange, formatTime12h } from '@/lib/dates';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, CalendarPlus, Search, Sparkles } from 'lucide-react';
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
        <p className="text-sm text-primary-foreground/80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/80">A little rest goes a long way.</p>
      </div>

      {bookingsQuery.isLoading ? <PageSkeleton rows={4} /> : null}
      {bookingsQuery.isError ? <ErrorBanner message="We couldn't load your bookings" retry={() => bookingsQuery.refetch()} /> : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Next stay</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming ? (
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-foreground">{upcoming.bookingReference}</p>
                    <p className="text-sm text-muted-foreground">{formatStayRange(upcoming.checkInDate, upcoming.checkOutDate)}</p>
                    <p className="text-sm text-muted-foreground">{`Check-in ${formatTime12h(upcoming.checkInTime)} · check-out ${formatTime12h(upcoming.checkOutTime)}`}</p>
                    <p className="text-sm text-muted-foreground">{upcomingNights} {upcomingNights === 1 ? 'night' : 'nights'} · {formatMoney(upcoming.totalAmount)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={bookingStatusTone(upcoming.status)}>{bookingStatusLabel(upcoming.status)}</Badge>
                      {upcoming.isOverdueCheckOut ? <Badge variant="destructive">Overdue check-out</Badge> : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No upcoming stays.</p>
                    <Button asChild size="sm"><Link to="/book">Plan a stay</Link></Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total stays</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-foreground">{totalStays}</p>
                <p className="text-sm text-muted-foreground">{bookings.length} bookings on file</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Payment on your next stay</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming ? (
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-foreground">{paymentStatusLabel(upcoming.paymentStatus)}</p>
                    <p className="text-sm text-muted-foreground">Pay at the hotel on arrival</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bookings to show.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <CalendarPlus className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Book a room</p>
                  <p className="text-sm text-muted-foreground">Check availability and reserve</p>
                  <Link to="/book" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Start now <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <Search className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Find a booking</p>
                  <p className="text-sm text-muted-foreground">Look up a reservation by reference</p>
                  <Link to="/my-booking" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Search <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-accent">
              <CardContent className="flex items-center gap-4 p-6">
                <CalendarDays className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">My bookings</p>
                  <p className="text-sm text-muted-foreground">See all of your reservations</p>
                  <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent bookings</CardTitle>
              <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No bookings yet — your reservations will appear here.</p>
              ) : (
                <ul className="divide-y">
                  {bookings.slice(0, 5).map((b) => (
                    <li key={b.id} className="relative flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{b.bookingReference}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatStayRange(b.checkInDate, b.checkOutDate)}{b.checkInTime ? ` · ${formatTime12h(b.checkInTime)}` : ''} · {formatMoney(b.totalAmount)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <RowLink to={`/dashboard/bookings/${b.id}`} label={`Open booking ${b.bookingReference}`} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>To change or cancel an existing booking, contact the hotel — changes aren&apos;t yet available online.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}