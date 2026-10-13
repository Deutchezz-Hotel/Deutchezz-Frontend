import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAdminBookings, useReceptionAction } from '@/hooks/queries';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { toApiError } from '@/api/problem';
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
import { formatStayRange, isEarlyCheckOut } from '@/lib/dates';
import { ArrowUpRight, CalendarDays, LogOut, Plus, X } from 'lucide-react';
import type { BookingListItem } from '@/types';

const FILTERS = ['All', 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'] as const;

export default function AdminBookingsPage() {
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const [checkOutTarget, setCheckOutTarget] = useState<BookingListItem | null>(null);
  const nav = useNavigate();
  const action = useReceptionAction();

  // Dashboard cards drill down here with a quick filter in the URL (SoT v1.12).
  const activeOnly = params.get('activeOnly') === 'true';
  const overdueCheckOuts = params.get('overdueCheckOuts') === 'true';
  const checkOutToday = params.get('checkOutToday') === 'true';
  const drilldown = overdueCheckOuts
    ? 'Overdue check-outs'
    : activeOnly
      ? 'Active bookings'
      : checkOutToday
        ? 'Rooms freeing today'
        : null;

  const clearDrilldown = () => {
    const next = new URLSearchParams(params);
    next.delete('activeOnly');
    next.delete('overdueCheckOuts');
    next.delete('checkOutToday');
    setParams(next, { replace: true });
  };

  const bookingsQuery = useAdminBookings({
    pageSize: 100,
    search: search || undefined,
    ...(status === 'All' ? {} : { status }),
    ...(activeOnly ? { activeOnly: true } : {}),
    ...(overdueCheckOuts ? { overdueCheckOuts: true } : {}),
    ...(checkOutToday ? { checkOutToday: true } : {}),
  });
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

      {drilldown ? (
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="gap-1.5 pl-2.5">
            {drilldown}
            <button
              type="button"
              onClick={clearDrilldown}
              aria-label="Clear filter"
              className="rounded-full p-0.5 hover:bg-warning-soft/60"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      ) : null}

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
                      <TableCell className="text-muted-foreground">
                        {b.status === 'CheckedIn' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-1"
                            disabled={action.checkOut.isPending}
                            onClick={() => (isEarlyCheckOut(b.checkOutDate, b.checkOutTime) ? nav(`/admin/bookings/${b.id}`) : setCheckOutTarget(b))}
                            title={isEarlyCheckOut(b.checkOutDate, b.checkOutTime) ? 'Early check-out — open the booking' : undefined}
                          >
                            <LogOut className="mr-1 h-3.5 w-3.5" /> Check out
                          </Button>
                        ) : null}
                        <ArrowUpRight className="inline h-4 w-4 align-middle" />
                        <RowLink to={`/admin/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <AlertDialog open={checkOutTarget !== null} onOpenChange={(o) => { if (!o) setCheckOutTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check out {checkOutTarget?.bookingReference}?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm the guest has left. Their rooms will return to Available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={action.checkOut.isPending}
              onClick={() => {
                if (!checkOutTarget) return;
                action.checkOut.mutate(
                  { id: checkOutTarget.id },
                  {
                    onSuccess: () => { toast.success('Checked out'); setCheckOutTarget(null); },
                    onError: (error) => { toast.error(toApiError(error).userMessage); setCheckOutTarget(null); },
                  },
                );
              }}
            >
              Check out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
