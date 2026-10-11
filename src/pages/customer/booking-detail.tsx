import { useParams, Link } from 'react-router-dom';
import { useMeBooking } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { formatDisplayDate, formatStayRange } from '@/lib/dates';
import { ArrowLeft } from 'lucide-react';

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useMeBooking(id);

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError || !booking) return <ErrorBanner message="We couldn't load this booking" retry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">
        <ArrowLeft className="h-4 w-4" /> My bookings
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="heading-2">{booking.bookingReference}</h1>
          <Badge variant="secondary">{bookingStatusLabel(booking.status)}</Badge>
          <Badge variant="outline">{paymentStatusLabel(booking.paymentStatus)}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">Booked {formatDisplayDate(booking.createdAt)}</p>
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
                        <p className="font-medium text-ink-900">{line.quantity} × {line.roomTypeName}</p>
                        <p className="text-xs text-ink-600">{formatMoney(line.ratePerNight)} / night · {formatMoney(line.subtotal)} total</p>
                      </div>
                      {assigned.length ? <p className="text-sm text-ink-700">Rooms {assigned.join(', ')}</p> : null}
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
              <p className="font-medium text-ink-900">{booking.guest.firstName} {booking.guest.lastName}</p>
              <p className="text-ink-600">{booking.guest.email}</p>
              {booking.guest.phoneNumber ? <p className="text-ink-600">{booking.guest.phoneNumber}</p> : null}
              {booking.specialRequests ? <p className="mt-3 rounded-lg bg-milk p-3 text-ink-700">Special requests: {booking.specialRequests}</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-ink-700">
              <p>{formatStayRange(booking.checkInDate, booking.checkOutDate)}</p>
              <p>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.adults} adults · {booking.children} children</p>
              <p className="pt-2 text-2xl font-semibold text-forest-700">{formatMoney(booking.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-ink-700">
              <p className="font-medium">{paymentStatusLabel(booking.paymentStatus)}</p>
              <p className="text-ink-600">Due on arrival · {formatMoney(booking.totalAmount)} total</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}