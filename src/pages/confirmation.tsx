import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { ExtendedStayCharge } from '@/components/extended-stay-charge';
import { DEFAULT_STAY_POLICY } from '@/config/stayPolicy';
import { formatStayRange, formatTime12h } from '@/lib/dates';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { bookingOverageMinutes } from '@/lib/pricing';
import { toApiError } from '@/api/problem';
import { useAnonymousCancelBooking, useStayPolicy } from '@/hooks/queries';
import { useAuth } from '@/app/auth';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Printer, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BookingResponse } from '@/types';

export default function ConfirmationPage() {
  const { bookingReference } = useParams<{ bookingReference: string }>();
  const location = useLocation() as { state?: BookingResponse };
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: policyData } = useStayPolicy();
  const graceHours = (policyData ?? DEFAULT_STAY_POLICY).graceHours;
  const [booking, setBooking] = useState<BookingResponse | null>(location.state ?? null);
  const cancel = useAnonymousCancelBooking();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!booking && bookingReference) {
      nav(`/my-booking?bookingReference=${encodeURIComponent(bookingReference)}`, { replace: true });
    }
  }, [booking, bookingReference, nav]);

  const data = booking;
  const overageMinutes = data ? bookingOverageMinutes(data) : 0;
  const canCancel = !!data && (data.status === 'Confirmed' || data.status === 'Pending');

  const runCancel = () => {
    if (!data) return;
    cancel.mutate(
      { bookingReference: data.bookingReference, email: data.guest.email ?? '', reason: reason.trim() || undefined },
      {
        onSuccess: (updated) => {
          setBooking(updated);
          setCancelOpen(false);
          toast.success('Booking cancelled. A confirmation has been emailed to you.');
        },
        onError: (error) => toast.error(toApiError(error).userMessage),
      },
    );
  };

  return (
    <>
      <PageHero
        eyebrow="Reservation confirmed"
        title={<>Your stay is <em className="italic">waiting for you.</em></>}
        description="Your booking has been confirmed. Please keep the reference handy."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-2xl print:border-0 print:shadow-none">
          <CardContent className="space-y-8 p-10">
            {data ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-accent p-4 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">Booking confirmed — a confirmation has been emailed to {data.guest.email}.</p>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="text-xl font-semibold tracking-widest text-foreground">{data.bookingReference}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-semibold text-primary">{formatMoney(data.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Stay</p>
                    <p className="font-medium">{formatStayRange(data.checkInDate, data.checkOutDate)} · {data.nights} {data.nights === 1 ? 'night' : 'nights'}</p>
                    <p className="text-sm text-muted-foreground">{`Check-in ${formatTime12h(data.checkInTime)} · check-out ${formatTime12h(data.checkOutTime)}`}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{bookingStatusLabel(data.status)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <p className="font-medium">{paymentStatusLabel(data.paymentStatus)} · Pay at hotel</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Guest</p>
                    <p className="font-medium">{data.guest.firstName} {data.guest.lastName}</p>
                    <p className="text-sm text-muted-foreground">{data.guest.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Rooms</p>
                  <ul className="divide-y rounded-lg border">
                    {data.rooms.map((room) => (
                      <li key={room.bookingRoomTypeId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">
                          {room.quantity > 1 ? `${room.quantity} × ${room.roomTypeName}` : room.roomTypeName} · {formatMoney(room.ratePerNight)} / night
                        </span>
                        <span className="font-medium text-foreground">{formatMoney(room.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  {overageMinutes > 0 ? (
                    <ExtendedStayCharge
                      overageMinutes={overageMinutes}
                      amount={data.extraChargeAmount}
                      graceHours={graceHours}
                    />
                  ) : null}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Check-in: {data.checkInDate} at {formatTime12h(data.checkInTime)}</p>
                  <p>Check-out: {data.checkOutDate} by {formatTime12h(data.checkOutTime)}</p>
                  <p className="text-muted-foreground">
                    Keep this reference safe. If you booked as a guest without an account, this confirmation is your only record of the booking.
                  </p>
                </div>

                {!user ? (
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <p className="text-sm font-medium text-foreground">Create an account to save this booking</p>
                    <p className="text-sm text-muted-foreground">Sign up to manage your reservations and check out faster next time.</p>
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
                  {canCancel ? (
                    <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive-outline">
                          <XCircle className="mr-2 h-4 w-4" /> Cancel booking
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {data.bookingReference} will be cancelled and the rooms freed for other guests.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason (optional)"
                          className="min-h-20"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep booking</AlertDialogCancel>
                          <AlertDialogAction onClick={runCancel} disabled={cancel.isPending}>
                            {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-lg text-muted-foreground">
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
        </Reveal>
      </section>
    </>
  );
}
