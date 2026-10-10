import { useState } from 'react';
import { useReceptionPayments, useReceptionBookings, useRecordPayment } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatMoney, paymentMethodLabel } from '@/lib/format';
import { formatDisplayDate } from '@/lib/dates';
import { toast } from 'sonner';
import { CreditCard, Plus } from 'lucide-react';
import type { PaymentMethod } from '@/types';

const METHODS: PaymentMethod[] = ['Cash', 'POS', 'BankTransfer'];

export default function ReceptionPaymentsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const paymentsQuery = useReceptionPayments({ pageSize: 100, search: search || undefined });
  const bookingsQuery = useReceptionBookings({ pageSize: 100 });
  const record = useRecordPayment();

  const payments = paymentsQuery.data?.items ?? [];
  const openBookings = (bookingsQuery.data?.items ?? []).filter((b) => b.paymentStatus !== 'Paid');

  const submit = () => {
    const amt = Number(amount);
    if (!bookingId || !amt || amt <= 0) {
      toast.error('Choose a booking and enter an amount');
      return;
    }
    record.mutate(
      { bookingId, amount: amt, paymentMethod: method, reference: reference.trim() || null, notes: notes.trim() || null },
      {
        onSuccess: () => { toast.success('Payment recorded'); setOpen(false); setAmount(''); setBookingId(''); setReference(''); setNotes(''); },
        onError: () => toast.error('Could not record the payment'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Payments</h1>
          <p className="text-sm text-ink-600">Money received at the front desk.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-full sm:w-56" placeholder="Search reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record payment</Button>
        </div>
      </div>

      {paymentsQuery.isLoading ? <PageSkeleton rows={6} /> : null}
      {paymentsQuery.isError ? <ErrorBanner message="We couldn't load payments" retry={() => paymentsQuery.refetch()} /> : null}

      {!paymentsQuery.isLoading && !paymentsQuery.isError ? (
        payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" body="Record your first payment to see it here." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference no.</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-ink-900">{p.bookingReference}</TableCell>
                      <TableCell className="font-medium">{formatMoney(p.amount)}</TableCell>
                      <TableCell>{paymentMethodLabel(p.paymentMethod)}</TableCell>
                      <TableCell className="text-ink-700">{p.reference ?? '—'}</TableCell>
                      <TableCell className="text-ink-700">{p.notes ?? '—'}</TableCell>
                      <TableCell className="text-ink-700">{formatDisplayDate(p.recordedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Booking</Label>
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger><SelectValue placeholder="Choose a booking that still owes" /></SelectTrigger>
                <SelectContent>
                  {openBookings.length === 0 ? <div className="p-2 text-sm text-ink-600">No bookings owing.</div> : null}
                  {openBookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.bookingReference} · {b.guestName} · owes {formatMoney(b.totalAmount)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m} value={m}>{paymentMethodLabel(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference number (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. POS slip number" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={record.isPending}>{record.isPending ? 'Saving…' : 'Record payment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}