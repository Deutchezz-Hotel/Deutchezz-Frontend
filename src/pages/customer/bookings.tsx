import { useState } from 'react';
import { useMeBookings } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { RowLink } from '@/components/shared';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarCheck } from 'lucide-react';
import type { BookingStatus } from '@/types';

const FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'CheckedIn', label: 'Checked in' },
  { key: 'CheckedOut', label: 'Checked out' },
  { key: 'Cancelled', label: 'Cancelled' },
] as const;

export default function CustomerBookingsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('All');
  const bookingsQuery = useMeBookings({ pageSize: 100, ...(filter === 'All' ? {} : { status: filter }) });

  const bookings = bookingsQuery.data?.items ?? [];
  const statusBadge = (status: BookingStatus) => {
    const tone =
      status === 'Cancelled' ? 'destructive'
      : status === 'CheckedIn' ? 'success'
      : status === 'Confirmed' ? 'default'
      : status === 'CheckedOut' ? 'secondary'
      : 'warning';
    return <Badge variant={tone}>{bookingStatusLabel(status)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">My bookings</h1>
          <p className="text-sm text-ink-600">All the reservations on your account.</p>
        </div>
        <Link to="/book" className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">
          Book a room <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {bookingsQuery.isLoading ? <PageSkeleton rows={5} /> : null}
      {bookingsQuery.isError ? <ErrorBanner message="We couldn't load your bookings" retry={() => bookingsQuery.refetch()} /> : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings here yet" body="When you reserve a room, it will show up on this page." action={{ label: 'Book a room', to: '/book' }} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-9"><span className="sr-only">Open</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="relative hover:bg-milk">
                      <TableCell className="font-medium text-ink-900">{b.bookingReference}</TableCell>
                      <TableCell>
                        <p>{formatStayRange(b.checkInDate, b.checkOutDate)}</p>
                        <p className="text-xs text-ink-600">{b.nights} {b.nights === 1 ? 'night' : 'nights'}</p>
                      </TableCell>
                      <TableCell className="font-medium">{formatMoney(b.totalAmount)}</TableCell>
                      <TableCell>{statusBadge(b.status)}</TableCell>
                      <TableCell>{paymentStatusLabel(b.paymentStatus)}</TableCell>
                      <TableCell className="text-ink-400"><ArrowUpRight className="h-4 w-4" /><RowLink to={`/dashboard/bookings/${b.id}`} label={`Open booking ${b.bookingReference}`} /></TableCell>
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