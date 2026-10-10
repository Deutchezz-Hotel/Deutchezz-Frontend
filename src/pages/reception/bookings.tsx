import { useState } from 'react';
import { useReceptionBookings } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { formatStayRange } from '@/lib/dates';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';

const FILTERS = ['All', 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'] as const;

export default function ReceptionBookingsPage() {
  const nav = useNavigate();
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const query = useReceptionBookings({ pageSize: 100, search: search || undefined, ...(status === 'All' ? {} : { status }) });
  const bookings = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Bookings</h1>
          <p className="text-sm text-ink-600">Search, check in and manage reservations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="w-full sm:w-64" placeholder="Search guest, reference or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => nav('/reception/bookings/new')}><Plus className="mr-2 h-4 w-4" /> Walk-in booking</Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full flex-wrap md:w-auto">
          {FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load bookings" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        bookings.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No bookings match" body="Try a different filter, or create a walk-in booking." action={{ label: 'New walk-in booking', to: '/reception/bookings/new' }} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => nav(`/reception/bookings/${b.id}`)}>
                      <TableCell>
                        <p className="font-medium text-ink-900">{b.guestName}</p>
                        <p className="text-xs text-ink-600">{b.guestEmail}</p>
                      </TableCell>
                      <TableCell className="text-ink-700">{b.bookingReference}</TableCell>
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

      <p className="text-sm text-ink-600">
        Bookings can be opened from any row. To change a booking, contact the guest and update at the front desk.
      </p>
    </div>
  );
}