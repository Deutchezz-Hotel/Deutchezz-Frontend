import { useAdminDashboard, useAdminBookings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, LoadingSkeleton } from '@/components/feedback';
import { RowLink } from '@/components/shared';
import { formatMoney, formatCompactMoney, bookingStatusLabel } from '@/lib/format';
import { bookingStatusTone } from '@/lib/status';
import { formatStayRange, formatTime12h } from '@/lib/dates';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboard();
  const data = dashboardQuery.data;
  const latestQuery = useAdminBookings({ pageSize: 5, sort: 'createdAt', direction: 'desc' });
  const recentQuery = useAdminBookings({ pageSize: 6, sort: 'updatedAt', direction: 'desc' });

  if (dashboardQuery.isLoading) return <PageSkeleton rows={4} />;
  if (dashboardQuery.isError) return <ErrorBanner message="We couldn't load the dashboard" retry={() => dashboardQuery.refetch()} />;
  if (!data) return null;

  const trend = data.revenueTrend.map((d) => ({ date: d.date.slice(5), revenue: d.revenue }));
  const latest = latestQuery.data?.items ?? [];
  const recent = recentQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-2">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A snapshot of the hotel, right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rooms" value={`${data.occupiedRooms} / ${data.totalRooms}`} hint={`${data.availableRooms} available · ${data.occupiedRooms} occupied`} />
        <StatCard label="Occupancy" value={`${data.occupancyRate}%`} hint="of rooms currently occupied" />
        <StatCard label="Active bookings" value={String(data.activeBookings)} to="/admin/bookings?activeOnly=true" hint="pending, confirmed & in-house" />
        <StatCard label="Revenue today" value={formatMoney(data.monthlyRevenue)} hint="payments recorded today" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available now" value={String(data.availableNow)} hint={`${data.inHouse} in house`} />
        <StatCard
          label="Overdue check-outs"
          value={String(data.overdueCheckOuts)}
          hint="Checked in past check-out time"
          to="/admin/bookings?overdueCheckOuts=true"
          tone={data.overdueCheckOuts > 0 ? 'warning' : undefined}
        />
        <StatCard
          label="Rooms freeing today"
          value={String(data.roomsFreeingToday)}
          hint="Available again before midnight"
          to="/admin/bookings?checkOutToday=true"
        />
        <StatCard label="Room types" value={String(data.roomTypePerformance.length)} hint="With recorded performance" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No revenue recorded in the last 30 days.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      interval="preserveStartEnd"
                      minTickGap={24}
                      stroke="hsl(var(--border))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => formatCompactMoney(v)}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      width={64}
                      stroke="hsl(var(--border))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--border))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        color: 'hsl(var(--popover-foreground))',
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      formatter={(value: number) => [formatMoney(value), 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bookingsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not available from the API.</p>
            ) : (
              data.bookingsByStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{bookingStatusLabel(row.status)}</span>
                  <span className="text-sm font-semibold text-foreground">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room type performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.roomTypePerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not available from the API.</p>
          ) : (
            data.roomTypePerformance.map((rt, i) => (
            <div key={rt.roomTypeId} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-sm text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{rt.name}</p>
                  <p className="shrink-0 text-sm font-medium text-primary">{formatMoney(rt.revenue)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-2"
                    style={{ width: `${data.roomTypePerformance[0]?.revenue ? Math.max(4, Math.round((rt.revenue / data.roomTypePerformance[0].revenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Latest reservations</CardTitle>
            <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {latestQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-12" />)}
              </div>
            ) : latestQuery.isError ? (
              <div className="p-4"><ErrorBanner message="We couldn't load the latest reservations" retry={() => latestQuery.refetch()} /></div>
            ) : latest.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No reservations yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-9"><span className="sr-only">Open</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latest.map((b) => (
                    <TableRow key={b.id} className="relative hover:bg-accent">
                      <TableCell className="font-medium text-foreground">{b.bookingReference}</TableCell>
                      <TableCell>{b.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatStayRange(b.checkInDate, b.checkOutDate)}
                        {b.checkInTime ? <span className="block text-xs">{formatTime12h(b.checkInTime)}–{formatTime12h(b.checkOutTime)}</span> : null}
                      </TableCell>
                      <TableCell className="font-medium">{formatMoney(b.totalAmount)}</TableCell>
                      <TableCell><Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge></TableCell>
                      <TableCell className="w-9 text-muted-foreground"><ArrowUpRight className="h-4 w-4" /><RowLink to={`/admin/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent bookings</CardTitle>
            <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} className="h-12" />)}
              </div>
            ) : recentQuery.isError ? (
              <div className="p-4"><ErrorBanner message="We couldn't load the recent bookings" retry={() => recentQuery.refetch()} /></div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((b) => (
                  <li key={b.id} className="relative flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{b.guestName}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.bookingReference} · {formatStayRange(b.checkInDate, b.checkOutDate)}{b.checkInTime ? ` · ${formatTime12h(b.checkInTime)}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={bookingStatusTone(b.status)}>{bookingStatusLabel(b.status)}</Badge>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <RowLink to={`/admin/bookings/${b.id}`} label={`Open booking ${b.bookingReference} for ${b.guestName}`} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, to, tone }: { label: string; value: string; hint: string; to?: string; tone?: 'warning' }) {
  const card = (
    <Card className={tone === 'warning' ? 'border-warning/60 transition-colors' : to ? 'transition-colors hover:border-primary/50' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={tone === 'warning' ? 'text-2xl font-semibold text-warning' : 'text-2xl font-semibold text-foreground'}>{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );

  if (!to) return card;
  return (
    <Link to={to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}