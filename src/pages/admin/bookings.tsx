import { useState } from 'react';
import { useAdminBookings } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { RowLink } from '@/components/shared';
import { bookingStatusLabel, formatMoney, paymentStatusLabel } from '@/lib/format';
import { bookingStatusTone } from '@/lib/status';
import { formatStayRange } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Plus } from 'lucide-react';

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
          <p className="text-sm text-muted-foreground">Every reservation, across the hotel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-full sm:w-64"
            placeholder="Search booking reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button asChild><Link to="/admin/bookings/new"><Plus className="mr-2 h-4 w-4" /> Walk-in booking</Link></Button>
        </div>
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
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-9"><span className="sr-only">Open</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="relative hover:bg-accent">
                      <TableCell className="font-medium text-foreground">{b.bookingReference}</TableCell>
                      <TableCell>
                        <p>{b.guestName}</p>
                      </TableCell>
                      <TableCell>
                        <p>{formatStayRange(b.checkInDate, b.checkOutDate)}</p>
                        <p className="text-xs text-muted-foreground">{b.nights} {b.nights === 1 ? 'night' : 'nights'}</p>
                      </TableCell>
                      <TableCell className="font-medium">{formatMoney(b.totalAmount)}</TableCell>
                      <TableCell><Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{paymentStatusLabel(b.paymentStatus)}</TableCell>
                      <TableCell className="text-muted-foreground"><ArrowUpRight className="h-4 w-4" /><RowLink to={`/admin/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} /></TableCell>
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