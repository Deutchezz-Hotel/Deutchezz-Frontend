import { useState } from 'react';
import { useAdminPayments } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatMoney, paymentMethodLabel } from '@/lib/format';
import { formatDisplayDate } from '@/lib/dates';
import { CreditCard } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const query = useAdminPayments({ pageSize: 100, search: search || undefined });
  const payments = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Payments</h1>
          <p className="text-sm text-ink-600">A full record of everything received.</p>
        </div>
        <Input className="w-full sm:w-64" placeholder="Search reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load payments" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" />
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
    </div>
  );
}