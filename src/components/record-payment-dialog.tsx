import { useEffect, useRef, useState } from 'react';
import { useReceptionBookings, useReceptionBooking, useRecordPayment } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormDialog, FormDialogBody, FormDialogContent, FormDialogFooter, FormDialogHeader, FormDialogTitle } from '@/components/ui/form-dialog';
import { formatMoney, paymentMethodLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { toast } from 'sonner';
import { ChevronsUpDown } from 'lucide-react';
import type { BookingListItem, PaymentMethod } from '@/types';

const METHODS: PaymentMethod[] = ['Cash', 'POS', 'BankTransfer'];
const FORM_ID = 'record-payment-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog opens already locked to this booking (from a detail screen). */
  preselectedBookingId?: string | null;
}

const emptyErrors = { booking: '', amount: '', reference: '' };

export function RecordPaymentDialog({ open, onOpenChange, preselectedBookingId }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Only bookings that still owe money (7l) — the backend rejects paying a settled booking.
  const bookingsQuery = useReceptionBookings({
    pageSize: 50,
    hasBalanceDue: true,
    ...(debouncedQuery ? { search: debouncedQuery } : {}),
  });
  const record = useRecordPayment();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BookingListItem | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState(emptyErrors);
  const amountRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);

  const detailQuery = useReceptionBooking(selectedId ?? undefined);
  const detail = detailQuery.data;
  const options = bookingsQuery.data?.items ?? [];

  const totalAmount = detail?.totalAmount ?? selectedItem?.totalAmount ?? 0;
  const paid = detail?.payments?.totalPaid ?? 0;
  const balance = detail?.payments?.balance ?? selectedItem?.balanceDue ?? Math.max(0, totalAmount - paid);
  const guestName = detail ? `${detail.guest.firstName} ${detail.guest.lastName}`.trim() : selectedItem?.guestName ?? '';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open && preselectedBookingId) setSelectedId(preselectedBookingId);
  }, [open, preselectedBookingId]);

  useEffect(() => {
    if (!selectedId) return;
    setAmount('');
    setReference('');
    setErrors(emptyErrors);
  }, [selectedId]);

  useEffect(() => {
    if (detail && amount === '') setAmount(String(detail.payments?.balance ?? detail.totalAmount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  const pick = (booking: BookingListItem) => {
    setSelectedId(booking.id);
    setSelectedItem(booking);
    setPickerOpen(false);
  };

  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
    setPickerOpen(false);
    setSelectedId(null);
    setSelectedItem(null);
    setAmount('');
    setMethod('Cash');
    setReference('');
    setNotes('');
    setErrors(emptyErrors);
  };

  const submit = () => {
    const next = { ...emptyErrors };
    if (!selectedId) {
      next.booking = 'Choose a booking';
      setErrors(next);
      setPickerOpen(true);
      return;
    }
    const amt = Number(amount);
    const amountValid = !(!amt || Number.isNaN(amt) || amt <= 0 || amt > balance);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      next.amount = 'Enter an amount greater than 0';
    } else if (balance <= 0) {
      next.amount = 'This booking is already fully paid';
    } else if (amt > balance) {
      next.amount = `Amount can't exceed the balance due (${formatMoney(balance)})`;
    }
    const referenceValid = method === 'Cash' || reference.trim().length > 0;
    if (method !== 'Cash' && !reference.trim()) next.reference = 'Transaction reference is required';
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      if (amountValid === false) amountRef.current?.focus();
      else if (!referenceValid) referenceRef.current?.focus();
      return;
    }
    record.mutate(
      {
        bookingId: selectedId,
        amount: amt,
        paymentMethod: method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`${formatMoney(amt)} recorded${guestName ? ` for ${guestName}` : ''}`);
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error('Could not record the payment'),
      },
    );
  };

  return (
    <FormDialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>Record a payment</FormDialogTitle>
        </FormDialogHeader>
        <FormDialogBody>
          <form id={FORM_ID} className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {!selectedId ? (
            <div className="space-y-2">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    aria-label="Select a booking with an outstanding balance"
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-muted-foreground">Select a booking with a balance…</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search guest name or reference…"
                      value={query}
                      onValueChange={setQuery}
                    />
                    <CommandList>
                      {bookingsQuery.isLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
                      ) : bookingsQuery.isError ? (
                        <div className="py-6 text-center text-sm text-destructive-text">Couldn&apos;t load bookings</div>
                      ) : options.length === 0 ? (
                        <CommandEmpty>No bookings with an outstanding balance.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {options.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.id}
                              onSelect={() => pick(b)}
                              className="flex-col items-start gap-1"
                            >
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="font-medium text-foreground">{b.guestName}</span>
                                <span className="text-sm font-medium text-primary">{formatMoney(b.balanceDue)} due</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {b.bookingReference} · {formatStayRange(b.checkInDate, b.checkOutDate)}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-destructive-text">{errors.booking}</p>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-accent p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{guestName}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail?.bookingReference ?? selectedItem?.bookingReference}
                    {detail ? ` · ${formatStayRange(detail.checkInDate, detail.checkOutDate)}` : selectedItem ? ` · ${formatStayRange(selectedItem.checkInDate, selectedItem.checkOutDate)}` : ''}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => { setSelectedId(null); setSelectedItem(null); }}>Change</Button>
              </div>
              <div className="grid gap-1 pt-1 sm:grid-cols-3">
                <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">Total</span><span className="font-medium text-foreground">{formatMoney(totalAmount)}</span></div>
                <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">Paid so far</span><span className="font-medium text-foreground">{detail ? formatMoney(paid) : '—'}</span></div>
                <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">Balance due</span><span className="font-medium text-primary">{formatMoney(balance)}</span></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₦)</Label>
              <Input ref={amountRef} id="pay-amount" type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-destructive-text">{errors.amount}</p>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => { setMethod(v as PaymentMethod); setErrors((e) => ({ ...e, reference: '' })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{paymentMethodLabel(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-reference">Transaction reference {method === 'Cash' ? '(optional)' : ''}</Label>
            <Input ref={referenceRef} id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === 'Cash' ? 'Optional' : 'e.g. POS slip or transfer reference'} />
            <p className="text-xs text-destructive-text">{errors.reference}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Input id="pay-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          </form>
        </FormDialogBody>
        <FormDialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form={FORM_ID} disabled={record.isPending}>{record.isPending ? 'Saving…' : 'Record payment'}</Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  );
}
