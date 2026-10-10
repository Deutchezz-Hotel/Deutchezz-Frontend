import { useState } from 'react';
import { useAdminBookings } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { CalendarDays } from 'lucide-react';

const FILTERS = ['All', 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'] as const;

export default function AdminBookingsPage() {
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const bookingsQuery = useAdminBookings({ pageSize: 100, search: search || undefined, ...(status === 'All' ? {} : { status }) });
  const bookings = bookingsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Bookings</h1>
          <p className="text-sm text-ink-600">Every reservation, across the hotel.</p>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder="Search reference, guest or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {bookingsQuery.isLoading ? <PageSkeleton rows={6} /> : null}
      {bookingsQuery.isError ? <ErrorBanner message="We couldn't load bookings" retry={() => bookingsQuery.refetch()} /> : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        bookings.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No bookings match" body="Try a different filter or search." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-ink-900">{b.bookingReference}</TableCell>
                      <TableCell>
                        <p>{b.guestName}</p>
                        <p className="text-xs text-ink-600">{b.guestEmail}</p>
                      </TableCell>
                      <TableCell>
                        <p>{formatStayRange(b.checkInDate, b.checkOutDate)}</p>
                        <p className="text-xs text-ink-600">{b.nights} {b.nights === 1 ? 'night' : 'nights'}</p>
                      </TableCell>
                      <TableCell className="text-ink-700" title={b.roomsSummary}>{b.roomsCount}</TableCell>
                      <TableCell className="font-medium">{formatMoney(b.totalAmount)}</TableCell>
                      <TableCell><Badge variant="secondary">{bookingStatusLabel(b.status)}</Badge></TableCell>
                      <TableCell className="text-ink-700">{paymentStatusLabel(b.paymentStatus)}</TableCell>
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