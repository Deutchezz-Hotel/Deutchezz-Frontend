import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney, paymentMethodLabel } from '@/lib/format';
import { formatDateTime } from '@/lib/dates';
import type { PaymentListItem } from '@/types';

interface Props {
  payments: PaymentListItem[];
  surface: 'admin' | 'reception';
}

export function PaymentsTable({ payments, surface }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Booking</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Transaction reference</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Recorded</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Link
                to={`/${surface}/bookings/${p.bookingId}`}
                className="font-medium text-forest-700 hover:underline"
              >
                {p.bookingReference || p.bookingId.slice(0, 8)}
              </Link>
            </TableCell>
            <TableCell>{p.guestName || '—'}</TableCell>
            <TableCell className="font-medium">{formatMoney(p.amount)}</TableCell>
            <TableCell className="font-mono text-xs text-ink-700">{p.reference || '—'}</TableCell>
            <TableCell>{paymentMethodLabel(p.paymentMethod)}</TableCell>
            <TableCell className="whitespace-nowrap text-ink-700">{formatDateTime(p.paidAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
