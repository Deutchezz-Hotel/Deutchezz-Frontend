import { useEffect, useState } from 'react';
import { useReceptionAction } from '@/hooks/queries';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney, staffCancellationReasonLabel } from '@/lib/format';
import { toApiError } from '@/api';
import { toast } from 'sonner';
import type { BookingResponse, StaffCancellationReason } from '@/types';

const REASONS: StaffCancellationReason[] = ['GuestRequest', 'NoShow', 'BookedInError', 'Other'];

interface Props {
  /** The booking to cancel; `null` keeps the dialog closed. */
  booking: BookingResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Staff cancellation: pick a reason, optionally add notes, choose whether paid
 * amounts are refunded, then confirm. Walk-ins are never emailed; guests with an
 * account are notified by the backend.
 */
export function CancelBookingDialog({ booking, open, onOpenChange }: Props) {
  const { cancelBooking } = useReceptionAction();
  const [reason, setReason] = useState<StaffCancellationReason>('GuestRequest');
  const [notes, setNotes] = useState('');
  const [refund, setRefund] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const paidTotal = booking?.payments?.totalPaid ?? 0;
  const hasPaidPayments = paidTotal > 0;

  useEffect(() => {
    if (open) {
      setReason('GuestRequest');
      setNotes('');
      setRefund(true);
      setNotesError('');
      setConfirmOpen(false);
    }
  }, [open]);

  const submit = () => {
    if (reason === 'Other' && !notes.trim()) {
      setNotesError('Notes are required when the reason is Other.');
      return;
    }
    setNotesError('');
    setConfirmOpen(true);
  };

  const doCancel = () => {
    if (!booking) return;
    cancelBooking.mutate(
      {
        id: booking.id,
        request: {
          reason,
          notes: notes.trim() || null,
          refundPaidAmounts: hasPaidPayments ? refund : false,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Booking ${booking.bookingReference} cancelled`);
          setConfirmOpen(false);
          onOpenChange(false);
        },
        onError: (error) => {
          const err = toApiError(error);
          if (err.problem.code === 'booking.noshow_too_early') {
            toast.error('A no-show can only be recorded on or after the check-in date.');
          } else {
            toast.error(err.userMessage);
          }
          setConfirmOpen(false);
        },
      },
    );
  };

  return (
    <>
      <FormDialog open={open} onOpenChange={(o) => { if (!o) setConfirmOpen(false); onOpenChange(o); }}>
        <FormDialogContent className="sm:max-w-lg">
          <FormDialogHeader>
            <FormDialogTitle>Cancel booking</FormDialogTitle>
            <p className="text-sm text-muted-foreground">
              {booking ? `Cancel ${booking.bookingReference} and release its rooms.` : ''}
            </p>
          </FormDialogHeader>
          <FormDialogBody>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason</Label>
                <Select value={reason} onValueChange={(v: StaffCancellationReason) => setReason(v)}>
                  <SelectTrigger id="cancel-reason" data-dialog-autofocus>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{staffCancellationReasonLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-notes">
                  Notes {reason === 'Other' ? <span className="text-destructive">*</span> : '(optional)'}
                </Label>
                <Textarea
                  id="cancel-notes"
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); if (notesError) setNotesError(''); }}
                  rows={3}
                  placeholder={reason === 'Other' ? 'Describe why this booking is being cancelled' : 'Add context for the audit log'}
                />
                {notesError ? <p className="text-xs text-destructive">{notesError}</p> : null}
              </div>

              {hasPaidPayments ? (
                <div className="space-y-2">
                  <Label>Paid amounts</Label>
                  <RadioGroup value={refund ? 'refund' : 'keep'} onValueChange={(v) => setRefund(v === 'refund')}>
                    <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <RadioGroupItem value="refund" className="mt-0.5" />
                      <span>
                        <span className="font-medium text-ink-900">Refund payments</span>
                        <span className="block text-ink-600">Refund the {formatMoney(paidTotal)} already paid.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <RadioGroupItem value="keep" className="mt-0.5" />
                      <span>
                        <span className="font-medium text-ink-900">Keep payments</span>
                        <span className="block text-ink-600">Leave the paid amounts on record.</span>
                      </span>
                    </label>
                  </RadioGroup>
                </div>
              ) : null}
            </div>
          </FormDialogBody>
          <FormDialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Keep booking</Button>
            <Button variant="destructive" onClick={submit}>Cancel booking</Button>
          </FormDialogFooter>
        </FormDialogContent>
      </FormDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {booking
                ? `${booking.bookingReference} will be cancelled${
                    hasPaidPayments && refund ? ` and ${formatMoney(paidTotal)} refunded` : ''
                  }. This cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={doCancel}
              disabled={cancelBooking.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelBooking.isPending ? 'Cancelling…' : 'Yes, cancel booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
