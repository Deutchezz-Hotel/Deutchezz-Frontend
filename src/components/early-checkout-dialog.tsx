import { useEffect, useState } from 'react';
import { useReceptionAction } from '@/hooks/queries';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { appConfig } from '@/config/appConfig';
import { earlyCheckOutReasonLabel, formatMoney } from '@/lib/format';
import { formatDisplayDate } from '@/lib/dates';
import { toApiError } from '@/api';
import { toast } from 'sonner';
import type { BookingResponse, EarlyCheckOutReason } from '@/types';

const REASONS: EarlyCheckOutReason[] = ['GuestRequest', 'Emergency', 'RoomIssue', 'Other'];

interface Props {
  booking: BookingResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Early check-out: the guest is leaving before the scheduled check-out moment, so
 * staff record the reason and attest that the guest consented. The backend rejects
 * an early check-out without this (409 `booking.early_checkout_requires_consent`)
 * and, when the hotel requires it, only an administrator may proceed (403).
 */
export function EarlyCheckOutDialog({ booking, open, onOpenChange }: Props) {
  const { checkOut } = useReceptionAction();
  const [reason, setReason] = useState<EarlyCheckOutReason>('GuestRequest');
  const [notes, setNotes] = useState('');
  const [consented, setConsented] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [consentError, setConsentError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('GuestRequest');
      setNotes('');
      setConsented(false);
      setNotesError('');
      setConsentError('');
    }
  }, [open]);

  const submit = () => {
    if (!booking) return;
    const needsNotes = reason === 'Other' && !notes.trim();
    if (needsNotes) setNotesError('Notes are required when the reason is Other.');
    if (!consented) setConsentError('Confirm the guest has consented to checking out early.');
    if (needsNotes || !consented) return;

    checkOut.mutate(
      {
        id: booking.id,
        request: {
          earlyCheckOut: {
            reason,
            notes: notes.trim() || null,
            guestConsented: true,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(`Booking ${booking.bookingReference} checked out early`);
          onOpenChange(false);
        },
        onError: (error) => {
          const err = toApiError(error);
          if (err.problem.code === 'booking.notes_required') {
            setNotesError('Notes are required when the reason is Other.');
          } else {
            toast.error(err.userMessage);
          }
        },
      },
    );
  };

  const balance = booking?.payments?.balance ?? 0;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>Early check-out</FormDialogTitle>
          <p className="text-sm text-muted-foreground">
            {booking
              ? `${booking.guest.firstName} is checking out before the scheduled ${appConfig.checkOutTime} on ${formatDisplayDate(booking.checkOutDate)}.`
              : ''}
          </p>
        </FormDialogHeader>
        <FormDialogBody>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="early-reason">Reason</Label>
              <Select value={reason} onValueChange={(v: EarlyCheckOutReason) => { setReason(v); if (notesError) setNotesError(''); }}>
                <SelectTrigger id="early-reason" data-dialog-autofocus>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{earlyCheckOutReasonLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="early-notes">
                Notes {reason === 'Other' ? <span className="text-destructive-text">*</span> : '(optional)'}
              </Label>
              <Textarea
                id="early-notes"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); if (notesError) setNotesError(''); }}
                rows={3}
                placeholder={reason === 'Other' ? 'Describe why the guest is checking out early' : 'Add context for the audit log'}
              />
              {notesError ? <p className="text-xs text-destructive-text">{notesError}</p> : null}
            </div>

            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox
                checked={consented}
                onCheckedChange={(value) => { setConsented(value === true); if (consentError) setConsentError(''); }}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">Guest consents to early check-out</span>
                <span className="block text-muted-foreground">Recorded for audit; the guest agrees to leave before their scheduled check-out.</span>
              </span>
            </label>
            {consentError ? <p className="text-xs text-destructive-text">{consentError}</p> : null}

            {balance > 0 ? (
              <p className="rounded-lg bg-warning-soft p-3 text-xs text-warning">
                This booking has an outstanding balance of {formatMoney(balance)}. Check-out is refused while a balance is due if the hotel requires payment before check-out.
              </p>
            ) : null}
          </div>
        </FormDialogBody>
        <FormDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={checkOut.isPending}>
            {checkOut.isPending ? 'Checking out…' : 'Check out early'}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
