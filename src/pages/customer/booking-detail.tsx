import { useParams, Link } from 'react-router-dom';
import { useMeBooking, useStayPolicy } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { ExtendedStayCharge } from '@/components/extended-stay-charge';
import { DEFAULT_STAY_POLICY } from '@/config/stayPolicy';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { bookingOverageMinutes } from '@/lib/pricing';
import { bookingStatusTone, paymentStatusTone } from '@/lib/status';
import { formatDisplayDate, formatStayRange, formatTime12h } from '@/lib/dates';
import { ArrowLeft } from 'lucide-react';

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useMeBooking(id);
  const { data: policyData } = useStayPolicy();
  const graceHours = (policyData ?? DEFAULT_STAY_POLICY).graceHours;

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError || !booking) return <ErrorBanner message="We couldn't load this booking" retry={() => refetch()} />;

  const overageMinutes = bookingOverageMinutes(booking);

  return (
    <div className="space-y-6">
      <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" /> My bookings
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="heading-2">{booking.bookingReference}</h1>
          <Badge variant={bookingStatusTone(booking.status)}>{bookingStatusLabel(booking.status)}</Badge>
          {booking.isOverdueCheckOut ? <Badge variant="destructive">Overdue check-out</Badge> : null}
          <Badge variant={paymentStatusTone(booking.paymentStatus)}>{paymentStatusLabel(booking.paymentStatus)}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Booked {formatDisplayDate(booking.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.rooms.map((line) => {
                const assigned = line.assignedRoomNumbers ?? [];
                return (
                  <div key={line.bookingRoomTypeId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{line.quantity} × {line.roomTypeName}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(line.ratePerNight)} / night · {formatMoney(line.subtotal)} total</p>
                      </div>
                      {assigned.length ? <p className="text-sm text-muted-foreground">Rooms {assigned.join(', ')}</p> : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{booking.guest.firstName} {booking.guest.lastName}</p>
              <p className="text-muted-foreground">{booking.guest.email}</p>
              {booking.guest.phoneNumber ? <p className="text-muted-foreground">{booking.guest.phoneNumber}</p> : null}
              {booking.specialRequests ? <p className="mt-3 rounded-lg bg-accent p-3 text-muted-foreground">Special requests: {booking.specialRequests}</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{formatStayRange(booking.checkInDate, booking.checkOutDate)}</p>
              <p>{`Check-in ${formatTime12h(booking.checkInTime)} · check-out ${formatTime12h(booking.checkOutTime)}`}</p>
              {booking.actualCheckInAt ? <p>Actual check-in {formatTime12h(booking.actualCheckInAt.slice(11, 16))}</p> : null}
              <p>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.adults} adults · {booking.children} children</p>
              {overageMinutes > 0 ? (
                <div className="pt-2">
                  <ExtendedStayCharge
                    overageMinutes={overageMinutes}
                    amount={booking.extraChargeAmount}
                    graceHours={graceHours}
                  />
                </div>
              ) : null}
              <p className="pt-2 text-2xl font-semibold text-primary">{formatMoney(booking.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium">{paymentStatusLabel(booking.paymentStatus)}</p>
              <p className="text-muted-foreground">Due on arrival · {formatMoney(booking.totalAmount)} total</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}