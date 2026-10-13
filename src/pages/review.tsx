import { PageHero } from '@/components/branding';
import { Reveal } from '@/components/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation, useNavigate } from 'react-router-dom';
import { estimateTotal, type BookingFlowState } from '@/features/booking/types';
import { formatStayRange, formatTime12h } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { newIdempotencyKey } from '@/lib/id';
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
  const [idempotencyKey, setIdempotencyKey] = useState(() => location.state?.idempotencyKey ?? newIdempotencyKey());
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const createBooking = useCreateBooking();
  const [error, setError] = useState<ApiError | null>(null);
  const [duplicate, setDuplicate] = useState<{ reference?: string; minutesAgo?: number } | null>(null);

  useEffect(() => {
    if (!flow) nav('/book', { replace: true });
  }, [flow, nav]);

  if (!flow) return null;

  const { draft } = flow;
  const total = estimateTotal(draft);

  const runCreate = (acknowledgeDuplicate: boolean, key: string) => {
    setError(null);
    createBooking.mutate(
      {
        request: { ...draft.request, ...(acknowledgeDuplicate ? { acknowledgeDuplicate: true } : {}) },
        idempotencyKey: key,
      },
      {
        onSuccess: (booking) => {
          nav(`/booking/confirmation/${booking.bookingReference}`, { state: booking, replace: true });
        },
        onError: (e) => {
          const err = e as ApiError;
          if (!acknowledgeDuplicate && err.problem.code === 'booking.possible_duplicate') {
            setDuplicate({ reference: err.problem.reference, minutesAgo: err.problem.minutesAgo });
            return;
          }
          setError(err);
        },
      },
    );
  };

  const submit = () => runCreate(false, idempotencyKey);

  // A duplicate acknowledged: retry with a fresh idempotency key (the body differs).
  const continueAnyway = () => {
    const key = newIdempotencyKey();
    setIdempotencyKey(key);
    setDuplicate(null);
    runCreate(true, key);
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
              <p className="font-semibold text-foreground">Guest</p>
              <p className="text-muted-foreground">{draft.request.guest.firstName} {draft.request.guest.lastName}</p>
              <p className="text-sm text-muted-foreground">{draft.request.guest.email} · {draft.request.guest.phoneNumber}</p>
              {draft.request.specialRequests ? <p className="text-sm text-muted-foreground">Special requests: {draft.request.specialRequests}</p> : null}
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground">Stay</p>
              <p className="text-muted-foreground">{formatStayRange(draft.request.checkInDate, draft.request.checkOutDate)} · {draft.nights} {draft.nights === 1 ? 'night' : 'nights'}</p>
              <p className="text-sm text-muted-foreground">{`Check-in ${formatTime12h(draft.request.checkInTime)} · check-out ${formatTime12h(draft.request.checkOutTime)}`}</p>
              <p className="text-sm text-muted-foreground">{draft.request.adults} adults · {draft.request.children} children</p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground">Rooms</p>
              <ul className="divide-y rounded-lg border">
                {draft.lines.map((line) => (
                  <li key={line.roomTypeId} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{line.quantity} × {line.name} <span className="text-muted-foreground">({formatMoney(line.pricePerNight)} / night)</span></span>
                    <span className="font-medium text-foreground">{formatMoney(line.pricePerNight * line.quantity * draft.nights)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold text-foreground">Estimated total</span>
                <span className="text-xl font-semibold text-primary">{formatMoney(total)}</span>
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This is an estimate. The hotel confirms the final total when your booking is placed.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground">Payment</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-primary" /> Pay at the hotel on arrival
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  Pay online
                  <Badge variant="secondary">Coming soon</Badge>
                </span>
              </div>
            </div>

            {error ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-text">
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
                  <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /> View and manage all your reservations in one place</li>
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /> Check in faster on arrival</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> Keep your booking details safe across devices</li>
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

      <AlertDialog open={duplicate !== null} onOpenChange={(o) => { if (!o) setDuplicate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You may already have this booking</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-left">
                <p>
                  A booking for these details was created
                  {duplicate?.minutesAgo != null
                    ? ` ${duplicate.minutesAgo} minute${duplicate.minutesAgo === 1 ? '' : 's'} ago`
                    : ' a few moments ago'}
                  {duplicate?.reference ? ` (reference ${duplicate.reference})` : ''}.
                </p>
                <p>
                  Check your email for the confirmation before booking again. Only continue if you
                  really do want a second reservation.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel onClick={() => setDuplicate(null)}>Go back</AlertDialogCancel>
            <Button onClick={continueAnyway} disabled={createBooking.isPending}>
              {createBooking.isPending ? 'Confirming…' : 'Create another booking'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
