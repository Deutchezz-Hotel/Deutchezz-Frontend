import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation, useNavigate } from 'react-router-dom';
import { estimateTotal, type BookingFlowState } from '@/features/booking/types';
import { formatStayRange } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { newIdempotencyKey } from '@/lib/id';
import { appConfig } from '@/config/appConfig';
import { useCreateBooking } from '@/hooks/queries';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ApiError } from '@/api/problem';
import { useAuth } from '@/app/auth';
import { Check, Info, ShieldCheck, Sparkles } from 'lucide-react';

export default function ReviewPage() {
  const nav = useNavigate();
  const location = useLocation() as { state?: BookingFlowState };
  const flow = location.state;
  const { user } = useAuth();
  const [idempotencyKey] = useState(() => location.state?.idempotencyKey ?? newIdempotencyKey());
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const createBooking = useCreateBooking(idempotencyKey);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!flow) nav('/book', { replace: true });
  }, [flow, nav]);

  if (!flow) return null;

  const { draft } = flow;
  const total = estimateTotal(draft);

  const submit = () => {
    setError(null);
    createBooking.mutate(
      { request: draft.request },
      {
        onSuccess: (booking) => {
          nav(`/booking/confirmation/${booking.bookingReference}`, { state: booking, replace: true });
        },
        onError: (e) => setError(e as ApiError),
      },
    );
  };

  const handleConfirmClick = () => {
    if (user) submit();
    else setShowGuestDialog(true);
  };

  const isConflict = error?.status === 409;
  const isRateLimited = error?.status === 429;

  return (
    <>
      <PageHero
        eyebrow="Review & confirm"
        title={<>One last look <em className="italic">before you arrive.</em></>}
        description="Check your details. No payment is taken today — you pay at the hotel on arrival."
      />
      <section className="section-pad container-x">
        <Reveal>
          <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-8 p-10">
            <div className="space-y-2">
              <p className="font-semibold text-ink-900">Guest</p>
              <p className="text-ink-700">{draft.request.guest.firstName} {draft.request.guest.lastName}</p>
              <p className="text-sm text-ink-600">{draft.request.guest.email} · {draft.request.guest.phoneNumber}</p>
              {draft.request.specialRequests ? <p className="text-sm text-ink-600">Special requests: {draft.request.specialRequests}</p> : null}
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-ink-900">Stay</p>
              <p className="text-ink-700">{formatStayRange(draft.request.checkInDate, draft.request.checkOutDate)} · {draft.nights} {draft.nights === 1 ? 'night' : 'nights'}</p>
              <p className="text-sm text-ink-600">{draft.request.adults} adults · {draft.request.children} children · Check-in from {appConfig.checkInTime}</p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-ink-900">Rooms</p>
              <ul className="divide-y rounded-lg border">
                {draft.lines.map((line) => (
                  <li key={line.roomTypeId} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-ink-700">{line.quantity} × {line.name} <span className="text-ink-500">({formatMoney(line.pricePerNight)} / night)</span></span>
                    <span className="font-medium text-ink-900">{formatMoney(line.pricePerNight * line.quantity * draft.nights)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold text-ink-900">Estimated total</span>
                <span className="text-xl font-semibold text-forest-700">{formatMoney(total)}</span>
              </div>
              <p className="flex items-start gap-2 text-xs text-ink-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This is an estimate. The hotel confirms the final total when your booking is placed.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-ink-900">Payment</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-forest-700" /> Pay at the hotel on arrival
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-ink-500">
                  Pay online
                  <Badge variant="secondary">Coming soon</Badge>
                </span>
              </div>
            </div>

            {error ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <p>{error.userMessage}</p>
                {isConflict ? (
                  <Button size="sm" variant="outline" onClick={() => nav('/book', { state: { restart: true } })}>
                    Search again
                  </Button>
                ) : null}
                {isRateLimited ? <p className="text-xs">Please wait a moment before trying again.</p> : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={createBooking.isPending} onClick={handleConfirmClick}>
                {createBooking.isPending ? 'Confirming…' : 'Confirm booking'}
              </Button>
              <Button variant="outline" onClick={() => nav(-1)} disabled={createBooking.isPending}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
        </Reveal>
      </section>

      <AlertDialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Booking as a guest</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2 text-left">
                <p>You can continue without an account, or sign in to manage this booking later.</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-forest-600" /> View and manage all your reservations in one place</li>
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-forest-600" /> Check in faster on arrival</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-forest-600" /> Keep your booking details safe across devices</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel onClick={() => nav('/register', { state: flow })}>Create account</AlertDialogCancel>
            <AlertDialogCancel onClick={() => nav('/login', { state: flow })}>Log in</AlertDialogCancel>
            <Button onClick={submit} disabled={createBooking.isPending}>Continue as guest</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
