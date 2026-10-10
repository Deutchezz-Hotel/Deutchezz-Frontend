import { PageHero } from '@/components/branding';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { formatStayRange } from '@/lib/dates';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { appConfig } from '@/config/appConfig';
import type { BookingResponse } from '@/types';
import { useAuth } from '@/app/auth';
import { ArrowLeft, CheckCircle2, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ConfirmationPage() {
  const { bookingReference } = useParams<{ bookingReference: string }>();
  const location = useLocation() as { state?: BookingResponse };
  const nav = useNavigate();
  const { user } = useAuth();
  const [booking] = useState<BookingResponse | null>(location.state ?? null);
  const [resolved] = useState<BookingResponse | null>(() => {
    if (location.state) return location.state;
    if (bookingReference) {
      try {
        const raw = sessionStorage.getItem(`deutchezz.confirmation.${bookingReference}`);
        return raw ? (JSON.parse(raw) as BookingResponse) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!resolved && bookingReference) {
      nav(`/my-booking?bookingReference=${encodeURIComponent(bookingReference)}`, { replace: true });
    }
  }, [resolved, bookingReference, nav]);

  const data = booking ?? resolved;

  return (
    <>
      <PageHero
        eyebrow="Reservation confirmed"
        title={<>Your stay is <em className="font-serif italic">waiting for you.</em></>}
        description="Your booking has been confirmed. Please keep the reference handy."
      />
      <section className="section-pad container-x">
        <Card className="mx-auto max-w-2xl print:border-0 print:shadow-none">
          <CardContent className="space-y-8 p-10">
            {data ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-forest-50 p-4 text-forest-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">Booking confirmed — a confirmation has been emailed to {data.guest.email}.</p>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-ink-600">Reference</p>
                    <p className="text-xl font-semibold tracking-widest text-ink-900">{data.bookingReference}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-ink-600">Total</p>
                    <p className="text-xl font-semibold text-forest-700">{formatMoney(data.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-ink-600">Stay</p>
                    <p className="font-medium">{formatStayRange(data.checkInDate, data.checkOutDate)} · {data.nights} {data.nights === 1 ? 'night' : 'nights'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-ink-600">Status</p>
                    <p className="font-medium">{bookingStatusLabel(data.status)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-ink-600">Payment</p>
                    <p className="font-medium">{paymentStatusLabel(data.paymentStatus)} · Pay at hotel</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-ink-600">Guest</p>
                    <p className="font-medium">{data.guest.firstName} {data.guest.lastName}</p>
                    <p className="text-sm text-ink-600">{data.guest.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-ink-900">Rooms</p>
                  <ul className="divide-y rounded-lg border">
                    {data.rooms.map((room) => (
                      <li key={room.bookingRoomTypeId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <span className="text-ink-700">
                          {room.quantity > 1 ? `${room.quantity} × ${room.roomTypeName}` : room.roomTypeName} · {formatMoney(room.ratePerNight)} / night
                        </span>
                        <span className="font-medium text-ink-900">{formatMoney(room.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 text-sm text-ink-700">
                  <p>Check-in: {data.checkInDate} from {appConfig.checkInTime}</p>
                  <p>Check-out: {data.checkOutDate} until {appConfig.checkOutTime}</p>
                  <p className="text-ink-600">
                    Keep this reference safe. If you booked as a guest without an account, this confirmation is your only record of the booking.
                  </p>
                </div>

                {!user ? (
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <p className="text-sm font-medium text-ink-900">Create an account to save this booking</p>
                    <p className="text-sm text-ink-600">Sign up to manage your reservations and check out faster next time.</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/register">Create an account</Link>
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print confirmation
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/my-booking">Find another booking</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-lg text-ink-700">
                  We don&apos;t have the booking details for {bookingReference} in this session.
                </p>
                <Button asChild variant="outline">
                  <Link to="/my-booking" className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Find it with your reference and email
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
