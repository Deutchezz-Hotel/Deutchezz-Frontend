import { useAuth } from '@/app/auth';
import { useReceptionBookings, useReceptionRooms } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { RowLink } from '@/components/shared';
import { roomStatusLabel, bookingStatusLabel } from '@/lib/format';
import { bookingStatusTone } from '@/lib/status';
import { todayISO, formatStayRange } from '@/lib/dates';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import type { BookingListItem, RoomStatus } from '@/types';

export default function ReceptionDashboardPage() {
  const { user } = useAuth();
  const roomsQuery = useReceptionRooms({ pageSize: 200 });
  const bookingsQuery = useReceptionBookings({ pageSize: 100 });
  const overdueQuery = useReceptionBookings({ pageSize: 100, overdueArrivals: true });
  const today = todayISO();

  const rooms = roomsQuery.data?.items ?? [];
  const bookings = bookingsQuery.data?.items ?? [];
  const overdueArrivals = overdueQuery.data?.items ?? [];

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === 'Available').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'Maintenance').length;
  const occupancyRate = Math.round((occupiedRooms / Math.max(1, totalRooms)) * 100);

  const arrivalsToday = bookings.filter((b) => b.checkInDate === today && b.status !== 'Cancelled');
  const departuresToday = bookings.filter((b) => b.checkOutDate === today && b.status !== 'Cancelled');
  const inHouse = bookings.filter((b) => b.status === 'CheckedIn');

  const loading = roomsQuery.isLoading || bookingsQuery.isLoading;
  const error = roomsQuery.isError || bookingsQuery.isError;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Good day{user ? `, ${user.firstName}` : ''}.</h1>
          <p className="text-sm text-muted-foreground">{today} — here&apos;s the front desk at a glance.</p>
        </div>
        <Button asChild><Link to="/reception/bookings/new"><Plus className="mr-2 h-4 w-4" /> New walk-in</Link></Button>
      </div>

      {loading ? <PageSkeleton rows={3} /> : null}
      {error ? <ErrorBanner message="We couldn't load the dashboard" retry={() => { roomsQuery.refetch(); bookingsQuery.refetch(); }} /> : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Occupancy" value={`${occupancyRate}%`} hint={`${occupiedRooms} of ${totalRooms} rooms`} />
            <StatCard label="Available" value={String(availableRooms)} hint={`${maintenanceRooms} in maintenance`} />
            <StatCard label="Arrivals today" value={String(arrivalsToday.length)} hint="Ready to check in" />
            <StatCard label="In-house" value={String(inHouse.length)} hint={`${departuresToday.length} departures today`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {overdueArrivals.length > 0 ? (
              <Card className="border-warning/30 bg-warning-soft/60 lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-warning">Overdue arrivals ({overdueArrivals.length})</CardTitle>
                  <Link to="/reception/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-warning">
                    All bookings <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  <p className="pb-2 text-sm text-warning">Confirmed guests whose check-in date has passed. Follow up or cancel.</p>
                  <ul className="divide-y divide-border">
                    {overdueArrivals.map((b) => (
                      <li key={b.id} className="relative flex items-center justify-between gap-3 py-3 hover:bg-accent">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{b.guestName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.bookingReference} · was due {formatStayRange(b.checkInDate, b.checkOutDate)}
                            {b.guestPhoneNumber ? ` · ${b.guestPhoneNumber}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="warning">{bookingStatusLabel(b.status)}</Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <RowLink to={`/reception/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Arrivals today</CardTitle>
                <Link to="/reception/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  All bookings <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {arrivalsToday.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No arrivals due today.</p>
                ) : (
                  <ul className="divide-y">
                    {arrivalsToday.map((b) => (
                      <BookingRow key={b.id} b={b} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departures today</CardTitle>
              </CardHeader>
              <CardContent>
                {departuresToday.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No departures due today.</p>
                ) : (
                  <ul className="divide-y">
                    {departuresToday.map((b) => (
                      <BookingRow key={b.id} b={b} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Checked in now</CardTitle>
              </CardHeader>
              <CardContent>
                {inHouse.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No guests in-house right now.</p>
                ) : (
                  <ul className="divide-y">
                    {inHouse.map((b) => (
                      <BookingRow key={b.id} b={b} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rooms tonight</CardTitle>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No rooms on record.</p>
                ) : (
                  <div className="space-y-1">
                    {(['Occupied', 'Available', 'Maintenance'] as RoomStatus[]).map((s) => {
                      const count = rooms.filter((r) => r.status === s).length;
                      const pct = Math.round((count / Math.max(1, rooms.length)) * 100);
                      return (
                        <div key={s} className="flex items-center gap-3 py-2">
                          <span className="w-28 shrink-0 text-sm text-muted-foreground">{roomStatusLabel(s)}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-chart-2" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  <ul className="divide-y">
                    {bookings.slice(0, 8).map((b) => (
                      <li key={b.id} className="relative flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{b.guestName}</p>
                          <p className="truncate text-xs text-muted-foreground">{b.bookingReference} · {formatStayRange(b.checkInDate, b.checkOutDate)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <RowLink to={`/reception/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function BookingRow({ b }: { b: BookingListItem }) {
  return (
    <li className="relative flex items-center justify-between gap-3 py-3 hover:bg-accent">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{b.guestName}</p>
        <p className="truncate text-xs text-muted-foreground">{b.bookingReference} · {b.nights} {b.nights === 1 ? 'night' : 'nights'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <RowLink to={`/reception/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} />
    </li>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}