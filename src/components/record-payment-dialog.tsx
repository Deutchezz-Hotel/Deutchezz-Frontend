import { useEffect, useMemo, useState } from 'react';
import { useReceptionBookings, useReceptionBooking, useRecordPayment } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatMoney, paymentMethodLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import type { PaymentMethod } from '@/types';

const METHODS: PaymentMethod[] = ['Cash', 'POS', 'BankTransfer'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog opens already locked to this booking (from a detail screen). */
  preselectedBookingId?: string | null;
}

const emptyErrors = { booking: '', amount: '', reference: '' };

export function RecordPaymentDialog({ open, onOpenChange, preselectedBookingId }: Props) {
  const bookingsQuery = useReceptionBookings({ pageSize: 200 });
  const record = useRecordPayment();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState(emptyErrors);

  const detailQuery = useReceptionBooking(selectedId ?? undefined);
  const detail = detailQuery.data;
  const bookings = useMemo(() => bookingsQuery.data?.items ?? [], [bookingsQuery.data]);
  const selected = selectedId ? bookings.find((b) => b.id === selectedId) ?? null : null;

  const totalAmount = detail?.totalAmount ?? selected?.totalAmount ?? 0;
  const paid = detail?.payments?.totalPaid ?? 0;
  const balance = detail?.payments?.balance ?? Math.max(0, totalAmount - paid);
  const guestName = detail ? `${detail.guest.firstName} ${detail.guest.lastName}`.trim() : selected?.guestName ?? '';

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) => b.guestName.toLowerCase().includes(q) || b.bookingReference.toLowerCase().includes(q),
    );
  }, [bookings, query]);

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

  const reset = () => {
    setQuery('');
    setSelectedId(null);
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
      return;
    }
    const amt = Number(amount);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      next.amount = 'Enter an amount greater than 0';
    } else if (detail && balance <= 0) {
      next.amount = 'This booking is already fully paid';
    } else if (detail && amt > balance) {
      next.amount = `Amount can't exceed the balance due (${formatMoney(balance)})`;
    }
    if (method !== 'Cash' && !reference.trim()) next.reference = 'Transaction reference is required';
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!selectedId ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guest name or booking reference..."
                  autoFocus
                />
              </div>
              {matches.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-600">No bookings match your search.</p>
              ) : (
                <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {matches.slice(0, 6).map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(b.id)}
                        className="w-full rounded-lg border border-border bg-white p-3 text-left transition-colors hover:border-forest-300 hover:bg-milk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-ink-900">{b.guestName}</span>
                          <span className="text-sm font-medium text-forest-700">{formatMoney(b.totalAmount)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-600">
                          {b.bookingReference} · {formatStayRange(b.checkInDate, b.checkOutDate)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-destructive">{errors.booking}</p>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-milk p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{guestName}</p>
                  <p className="text-xs text-ink-600">
                    {detail?.bookingReference ?? selected?.bookingReference}
                    {detail ? ` · ${formatStayRange(detail.checkInDate, detail.checkOutDate)}` : ''}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(null)}>Change</Button>
              </div>
              <div className="grid gap-1 pt-1 sm:grid-cols-3">
                <div className="flex justify-between sm:flex-col"><span className="text-ink-600">Total</span><span className="font-medium text-ink-900">{formatMoney(totalAmount)}</span></div>
                <div className="flex justify-between sm:flex-col"><span className="text-ink-600">Paid so far</span><span className="font-medium text-ink-900">{detail ? formatMoney(paid) : '—'}</span></div>
                <div className="flex justify-between sm:flex-col"><span className="text-ink-600">Balance due</span><span className="font-medium text-forest-700">{detail ? formatMoney(balance) : '—'}</span></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₦)</Label>
              <Input id="pay-amount" type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-destructive">{errors.amount}</p>
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
            <Input id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === 'Cash' ? 'Optional' : 'e.g. POS slip or transfer reference'} />
            <p className="text-xs text-destructive">{errors.reference}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Input id="pay-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={submit} disabled={record.isPending}>{record.isPending ? 'Saving…' : 'Record payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
