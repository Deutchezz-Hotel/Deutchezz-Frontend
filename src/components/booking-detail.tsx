import { useParams, useNavigate } from 'react-router-dom';
import { useReceptionBooking, useReceptionAction, useReceptionRooms } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { formatMoney, bookingStatusLabel, paymentStatusLabel } from '@/lib/format';
import { formatDisplayDate, formatStayRange } from '@/lib/dates';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, LogIn, LogOut, ReceiptText } from 'lucide-react';
import { useState } from 'react';

export function BookingDetail({ backHref }: { backHref: string }) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data: booking, isLoading, isError, refetch } = useReceptionBooking(id);
  const action = useReceptionAction();
  const availableRoomsQuery = useReceptionRooms({ pageSize: 200, status: 'Available', date: booking?.checkInDate });
  const [pendingAction, setPendingAction] = useState<'checkIn' | 'checkOut' | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  if (isLoading) return <PageSkeleton rows={4} />;
  if (isError || !booking) return <ErrorBanner message="We couldn't load this booking" retry={() => refetch()} />;

  const paidTotal = booking.payments?.totalPaid ?? 0;
  const balance = booking.payments?.balance ?? Math.max(0, booking.totalAmount - paidTotal);

  const availableRooms = availableRoomsQuery.data?.items ?? [];
  const fullyAssigned = booking.rooms.every((line) => (line.assignedRoomNumbers ?? []).length >= line.quantity);
  const canCheckIn = (booking.status === 'Confirmed' || booking.status === 'Pending') && fullyAssigned;
  const canCheckOut = booking.status === 'CheckedIn';
  const needsRooms = booking.status === 'Pending' || booking.status === 'Confirmed';

  const runAction = (kind: 'checkIn' | 'checkOut') => {
    const target = kind === 'checkIn' ? action.checkIn : action.checkOut;
    target.mutate(booking.id, {
      onSuccess: () => { toast.success(kind === 'checkIn' ? 'Checked in' : 'Checked out'); setPendingAction(null); },
      onError: () => toast.error('Could not update this booking'),
    });
  };

  return (
    <div className="space-y-6">
      <button onClick={() => nav(backHref)} className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="heading-2">{booking.bookingReference}</h1>
            <Badge variant="secondary">{bookingStatusLabel(booking.status)}</Badge>
            <Badge variant="outline">{paymentStatusLabel(booking.paymentStatus)}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-600">Created {formatDisplayDate(booking.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {needsRooms ? (
            <Button size="sm" variant="outline" disabled={!fullyAssigned || !canCheckIn} onClick={() => setPendingAction('checkIn')}>
              <LogIn className="mr-2 h-4 w-4" /> Check in
            </Button>
          ) : null}
          {canCheckOut ? (
            <Button size="sm" variant="outline" onClick={() => setPendingAction('checkOut')}>
              <LogOut className="mr-2 h-4 w-4" /> Check out
            </Button>
          ) : null}
        </div>
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
                const missing = line.quantity - assigned.length;
                const candidates = availableRooms.filter((r) => r.roomTypeId === line.roomTypeId);
                return (
                  <div key={line.bookingRoomTypeId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink-900">{line.quantity} × {line.roomTypeName}</p>
                        <p className="text-xs text-ink-600">{formatMoney(line.ratePerNight)} / night · {formatMoney(line.subtotal)} total</p>
                      </div>
                      <p className="text-sm text-ink-700">
                        {assigned.length} of {line.quantity} assigned
                        {assigned.length ? ` · ${assigned.join(', ')}` : ''}
                      </p>
                    </div>
                    {missing > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-ink-600">Assign room:</span>
                        {candidates.length === 0 ? (
                          <span className="text-sm text-amber-600">No available {line.roomTypeName} rooms.</span>
                        ) : (
                          <Select onValueChange={(roomId) => action.assignRooms.mutate(
                            { id: booking.id, request: { assignments: [{ bookingRoomTypeId: line.bookingRoomTypeId, roomId }] } },
                            { onSuccess: () => toast.success('Room assigned'), onError: () => toast.error('Could not assign that room') },
                          )}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Choose a room" /></SelectTrigger>
                            <SelectContent>
                              {candidates.map((r) => <SelectItem key={r.id} value={r.id}>Room {r.roomNumber}</SelectItem>)}
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
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-ink-700">
                  <p><span className="text-ink-600">Paid {formatMoney(paidTotal)}</span> · <span className="text-ink-600">Balance</span> {formatMoney(balance)}</p>
                  <Badge variant="outline" className="mt-1">{paymentStatusLabel(booking.paymentStatus)}</Badge>
                </div>
                <Button size="sm" onClick={() => setPayOpen(true)} disabled={balance <= 0}>
                  <ReceiptText className="mr-2 h-4 w-4" /> Record payment
                </Button>
              </div>
              <p className="text-sm text-ink-600">
                {booking.payments ? 'Amounts reflect everything recorded against this booking.' : 'Payment totals update as money is recorded.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-5 text-sm text-ink-600">
          <KeyRound className="h-4 w-4 text-forest-700" />
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
            <AlertDialogAction onClick={() => pendingAction && runAction(pendingAction)} disabled={action.checkIn.isPending || action.checkOut.isPending}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecordPaymentDialog open={payOpen} onOpenChange={setPayOpen} preselectedBookingId={booking.id} />
    </div>
  );
}

export default BookingDetail;