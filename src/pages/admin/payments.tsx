import { useState } from 'react';
import { useAdminPayments } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { PaymentsTable } from '@/components/payments-table';
import { RecordPaymentDialog } from '@/components/record-payment-dialog';
import { CreditCard, Plus } from 'lucide-react';

export default function AdminPaymentsPage() {
  const query = useAdminPayments({ pageSize: 100 });
  const payments = query.data?.items ?? [];
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Payments</h1>
          <p className="text-sm text-ink-600">A full record of everything received.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record payment</Button>
      </div>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load payments" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <PaymentsTable payments={payments} surface="admin" />
            </CardContent>
          </Card>
        )
      ) : null}

      <RecordPaymentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
