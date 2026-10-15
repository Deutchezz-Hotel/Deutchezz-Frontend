import { useParams, useNavigate } from 'react-router-dom';
import { useReceptionBooking, useReceptionAction, useReceptionRooms, useAdminBookingActions, useStayPolicy } from '@/hooks/queries';
import { useAuth } from '@/app/auth';
import { ExtendedStayCharge } from '@/components/extended-stay-charge';
import { DEFAULT_STAY_POLICY } from '@/config/stayPolicy';
import { bookingOverageMinutes } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';
import { CancelBookingDialog } from '@/components/cancel-booking-dialog';
import { EarlyCheckOutDialog } from '@/components/early-checkout-dialog';
import { ChangeRoomTypeDialog } from '@/components/change-room-type-dialog';
import { ReassignRoomDialog } from '@/components/reassign-room-dialog';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { bookingStatusTone, paymentStatusTone } from '@/lib/status';
import { formatDisplayDate, formatInstant, formatStayRange, formatTime12h, isEarlyCheckOut } from '@/lib/dates';
import { toApiError, type ApiError } from '@/api';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, KeyRound, LogIn, LogOut, ReceiptText, RefreshCw, RotateCcw, Shuffle, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { AssignedRoom, BookingRoomLine } from '@/types';

export function BookingDetail({ backHref }: { backHref: string }) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: booking, isLoading, isError, refetch } = useReceptionBooking(id);
  const { user } = useAuth();
  const action = useReceptionAction();
  const adminActions = useAdminBookingActions();
  const boardAt = booking?.checkInTime ? `${booking.checkInDate}T${booking.checkInTime}` : undefined;
  const availableRoomsQuery = useReceptionRooms({ pageSize: 200, at: boardAt });
  const [pendingAction, setPendingAction] = useState<'checkIn' | 'checkOut' | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [roomTypeTarget, setRoomTypeTarget] = useState<BookingRoomLine | null>(null);
  const [reassignTarget, setReassignTarget] = useState<{ line: BookingRoomLine; assignment: AssignedRoom } | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<AssignedRoom | null>(null);
  const [lateTarget, setLateTarget] = useState<{ bookingRoomTypeId: string; roomId: string; roomNumber: string; availableFrom?: string } | null>(null);
  const [conflictError, setConflictError] = useState<ApiError | null>(null);
  const { data: policyData } = useStayPolicy();
  const graceHours = (policyData ?? DEFAULT_STAY_POLICY).graceHours;

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError || !booking) return <ErrorBanner message="We couldn't load this booking" retry={() => refetch()} />;

  const overageMinutes = bookingOverageMinutes(booking);
  const paidTotal = booking.payments?.totalPaid ?? 0;
  const balance = booking.payments?.balance ?? Math.max(0, booking.totalAmount - paidTotal);

  const availableRooms = availableRoomsQuery.data?.items ?? [];
  const fullyAssigned = booking.rooms.every((line) => (line.assignedRoomNumbers ?? []).length >= line.quantity);
  const canCheckIn = (booking.status === 'Confirmed' || booking.status === 'Pending') && fullyAssigned;
  const canCheckOut = booking.status === 'CheckedIn';
  const needsRooms = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canChangeRoomType = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canReassign = booking.status === 'Confirmed' || booking.status === 'CheckedIn';
  const canUnassign = booking.status === 'Pending' || booking.status === 'Confirmed';
  const checkOutIsEarly = isEarlyCheckOut(booking.checkOutDate, booking.checkOutTime);
  const isCancelled = booking.status === 'Cancelled';
  const isAdmin = user?.role === 'Administrator';

  const runRestore = () => {
    adminActions.restoreBooking.mutate(booking.id, {
      onSuccess: () => toast.success('Booking restored'),
      onError: (error) => toast.error(toApiError(error).userMessage),
    });
  };

  const runCheckIn = () => {
    action.checkIn.mutate(booking.id, {
      onSuccess: () => { toast.success('Checked in'); setPendingAction(null); },
      onError: (error) => { setPendingAction(null); toast.error(toApiError(error).userMessage); },
    });
  };

  const runCheckOut = () => {
    action.checkOut.mutate(
      { id: booking.id },
      {
        onSuccess: () => { toast.success('Checked out'); setPendingAction(null); },
        onError: (error) => {
          const api = toApiError(error);
          setPendingAction(null);
          if (api.problem.code === 'booking.early_checkout_requires_consent') {
            setEarlyOpen(true);
          } else {
            toast.error(api.userMessage);
          }
        },
      },
    );
  };

  const doUnassign = () => {
    if (!unassignTarget) return;
    action.unassignRoom.mutate(
      { id: booking.id, request: { roomAssignmentId: unassignTarget.id } },
      {
        onSuccess: () => { toast.success(`Room ${unassignTarget.roomNumber} unassigned`); setUnassignTarget(null); },
        onError: (error) => { toast.error(toApiError(error).userMessage); setUnassignTarget(null); },
      },
    );
  };

  const runAssignRoom = (bookingRoomTypeId: string, roomId: string, acknowledgeLateAvailability = false) => {
    action.assignRooms.mutate(
      { id: booking.id, request: { assignments: [{ bookingRoomTypeId, roomId }], acknowledgeLateAvailability } },
      {
        onSuccess: () => { toast.success('Room assigned'); setLateTarget(null); },
        onError: (error) => {
          const api = toApiError(error);
          setLateTarget(null);
          if (api.problem.code === 'room.available_later') {
            const room = availableRooms.find((r) => r.id === roomId);
            setLateTarget({ bookingRoomTypeId, roomId, roomNumber: api.problem.roomNumber ?? room?.roomNumber ?? '', availableFrom: api.problem.availableFrom });
          } else if (api.problem.code === 'room.occupied_until') {
            setConflictError(api);
          } else {
            toast.error(api.userMessage);
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <button onClick={() => nav(backHref)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="heading-2">{booking.bookingReference}</h1>
            <Badge variant={bookingStatusTone(booking.status)}>{bookingStatusLabel(booking.status)}</Badge>
            {booking.isOverdueCheckOut ? (
              <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Overdue check-out</Badge>
            ) : null}
            <Badge variant={paymentStatusTone(booking.paymentStatus)}>{paymentStatusLabel(booking.paymentStatus)}</Badge>
            {booking.source === 'WalkIn' ? <Badge variant="warning">Walk-in</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDisplayDate(booking.createdAt)}
            {booking.createdByName ? ` · Booked by ${booking.createdByName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {needsRooms ? (
            <Button size="sm" variant="outline" disabled={!fullyAssigned || !canCheckIn} onClick={() => setPendingAction('checkIn')}>
              <LogIn className="mr-2 h-4 w-4" /> Check in
            </Button>
          ) : null}
          {canCheckOut ? (
            <Button size="sm" variant="outline" onClick={() => (checkOutIsEarly ? setEarlyOpen(true) : setPendingAction('checkOut'))}>
              <LogOut className="mr-2 h-4 w-4" /> Check out
            </Button>
          ) : null}
          {canCancel ? (
            <Button size="sm" variant="destructive-outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel booking
            </Button>
          ) : null}
          {isCancelled && isAdmin ? (
            <Button size="sm" variant="outline" disabled={adminActions.restoreBooking.isPending} onClick={runRestore}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restore booking
            </Button>
          ) : null}
        </div>
      </div>

      {isCancelled ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                This booking was cancelled
                {booking.cancelledAt ? ` on ${formatInstant(booking.cancelledAt, { time: false })}` : ''}.
              </p>
              <p className="text-muted-foreground">
                {booking.hasPayments
                  ? 'It holds recorded payments, so it is kept for refund review and will not be removed automatically.'
                  : booking.purgeScheduledAt
                    ? `It will be permanently removed on ${formatInstant(booking.purgeScheduledAt, { time: false })}.`
                    : 'It can no longer be changed.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.rooms.map((line) => {
                const assigned = line.assignedRooms ?? [];
                const missing = line.quantity - assigned.length;
                const candidates = availableRooms.filter((r) => r.roomTypeId === line.roomTypeId && (r.effectiveStatus ?? r.status) === 'Available');
                return (
                  <div key={line.bookingRoomTypeId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{line.quantity} × {line.roomTypeName}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(line.ratePerNight)} / night · {formatMoney(line.subtotal)} total</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{assigned.length} of {line.quantity} assigned</p>
                        {canChangeRoomType ? (
                          <Button size="sm" variant="ghost" onClick={() => setRoomTypeTarget(line)}>
                            <Shuffle className="mr-2 h-4 w-4" /> Change type
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {assigned.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {assigned.map((room) => (
                          <li key={room.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-accent px-3 py-2">
                            <span className="text-sm font-medium text-foreground">Room {room.roomNumber}</span>
                            {canReassign || canUnassign ? (
                              <div className="flex items-center gap-1">
                                {canReassign ? (
                                  <Button size="sm" variant="ghost" onClick={() => setReassignTarget({ line, assignment: room })}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Change room
                                  </Button>
                                ) : null}
                                {canUnassign ? (
                                  <Button size="sm" variant="destructive-outline" onClick={() => setUnassignTarget(room)}>
                                    Unassign
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {missing > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Assign room:</span>
                        {candidates.length === 0 ? (
                          <span className="text-sm text-warning">No available {line.roomTypeName} rooms.</span>
                        ) : (
                          <Select onValueChange={(roomId) => runAssignRoom(line.bookingRoomTypeId, roomId)}>
                            <SelectTrigger className="w-52"><SelectValue placeholder="Choose a room" /></SelectTrigger>
                            <SelectContent>
                              {candidates.map((r) => <SelectItem key={r.id} value={r.id}>{`Room ${r.roomNumber} · Floor ${r.floor}`}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ) : null}
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
              {booking.guest.phoneNumber ? <p className="text-muted-foreground">{booking.guest.phoneNumber}</p> : null}
              {booking.guest.email ? <p className="text-muted-foreground">{booking.guest.email}</p> : null}
              {booking.source === 'WalkIn' && !booking.guest.email ? (
                <p className="text-muted-foreground">Walk-in guest — no email on record.</p>
              ) : null}
              {booking.createdByName ? <p className="pt-1 text-xs text-muted-foreground">Booked by {booking.createdByName}</p> : null}
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
              {booking.actualCheckInAt ? <p>Actual check-in {formatInstant(booking.actualCheckInAt)}</p> : null}
              {booking.actualCheckOutAt ? <p>Actual check-out {formatInstant(booking.actualCheckOutAt)}</p> : null}
              <p>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.adults} adults · {booking.children} children</p>
              {canCheckOut ? (
                <p className="text-xs text-muted-foreground">Scheduled check-out: {formatDisplayDate(booking.checkOutDate)} at {formatTime12h(booking.checkOutTime)}</p>
              ) : null}
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
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  <p><span className="text-muted-foreground">Paid {formatMoney(paidTotal)}</span> · <span className="text-muted-foreground">Balance</span> {formatMoney(balance)}</p>
                  <Badge variant={paymentStatusTone(booking.paymentStatus)} className="mt-1">{paymentStatusLabel(booking.paymentStatus)}</Badge>
                </div>
                <Button size="sm" onClick={() => setPayOpen(true)} disabled={balance <= 0 || isCancelled}>
                  <ReceiptText className="mr-2 h-4 w-4" /> Record payment
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {booking.payments ? 'Amounts reflect everything recorded against this booking.' : 'Payment totals update as money is recorded.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-5 text-sm text-muted-foreground">
          <KeyRound className="h-4 w-4 text-primary" />
          <p>Assign all rooms before checking in. After check-out, rooms return to Available automatically.</p>
        </CardContent>
      </Card>

      <AlertDialog open={pendingAction !== null} onOpenChange={(o) => { if (!o) setPendingAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'checkIn' ? 'Check in this booking?' : 'Check out this booking?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'checkIn'
                ? `Confirm that ${booking.guest.firstName} has arrived. Their assigned rooms will be marked Occupied.`
                : `Confirm that ${booking.guest.firstName} has left. Rooms will return to Available.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => (pendingAction === 'checkIn' ? runCheckIn() : runCheckOut())} disabled={action.checkIn.isPending || action.checkOut.isPending}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unassignTarget !== null} onOpenChange={(o) => { if (!o) setUnassignTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign room {unassignTarget?.roomNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This releases the room from the booking. Every room must be assigned again before check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep assigned</AlertDialogCancel>
            <AlertDialogAction onClick={doUnassign} disabled={action.unassignRoom.isPending}>Unassign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecordPaymentDialog open={payOpen} onOpenChange={setPayOpen} preselectedBookingId={booking.id} />
      <CancelBookingDialog booking={booking} open={cancelOpen} onOpenChange={setCancelOpen} />
      <EarlyCheckOutDialog booking={booking} open={earlyOpen} onOpenChange={setEarlyOpen} />
      <ChangeRoomTypeDialog booking={booking} line={roomTypeTarget} open={roomTypeTarget !== null} onOpenChange={(o) => { if (!o) setRoomTypeTarget(null); }} />
      <ReassignRoomDialog
        booking={booking}
        line={reassignTarget?.line ?? null}
        assignment={reassignTarget?.assignment ?? null}
        open={reassignTarget !== null}
        onOpenChange={(o) => { if (!o) setReassignTarget(null); }}
      />

      <AlertDialog open={lateTarget !== null} onOpenChange={(o) => { if (!o) setLateTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room {lateTarget?.roomNumber} isn&apos;t free right now</AlertDialogTitle>
            <AlertDialogDescription>
              {lateTarget?.availableFrom
                ? `${lateTarget.roomNumber ? `Room ${lateTarget.roomNumber}` : 'It'} frees up at ${formatInstant(lateTarget.availableFrom)}. You can still assign it now.`
                : 'It will free up before this stay begins. You can still assign it now.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Choose another room</AlertDialogCancel>
            <Button
              disabled={action.assignRooms.isPending}
              onClick={() => lateTarget && runAssignRoom(lateTarget.bookingRoomTypeId, lateTarget.roomId, true)}
            >
              {action.assignRooms.isPending ? 'Assigning…' : 'Assign anyway'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={conflictError !== null} onOpenChange={(o) => { if (!o) setConflictError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>That room is occupied for this stay</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-left">
                <p>These rooms clash with the requested stay. Choose another room.</p>
                <ul className="space-y-1 text-sm">
                  {(conflictError?.roomConflicts ?? []).map((c) => (
                    <li key={c.roomId} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                      <span className="font-medium">Room {c.roomNumber}</span>
                      {c.occupiedUntil ? <span className="text-muted-foreground">until {formatInstant(c.occupiedUntil)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflictError(null)}>Choose another room</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BookingDetail;
