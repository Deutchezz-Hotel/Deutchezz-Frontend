import { useAdminDashboard } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { formatMoney, formatCompactMoney, bookingStatusLabel } from '@/lib/format';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboard();
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) return <PageSkeleton rows={4} />;
  if (dashboardQuery.isError) return <ErrorBanner message="We couldn't load the dashboard" retry={() => dashboardQuery.refetch()} />;
  if (!data) return null;

  const trend = data.revenueTrend.map((d) => ({ date: d.date.slice(5), revenue: d.revenue }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-2">Dashboard</h1>
        <p className="text-sm text-ink-600">A snapshot of the hotel, right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rooms" value={`${data.occupiedRooms} / ${data.totalRooms}`} hint={`${data.availableRooms} available · ${data.occupiedRooms} occupied`} />
        <StatCard label="Occupancy" value={`${data.occupancyRate}%`} hint="of rooms currently occupied" />
        <StatCard label="Active bookings" value={String(data.activeBookings)} hint="pending, confirmed & in-house" />
        <StatCard label="Revenue this month" value={formatMoney(data.monthlyRevenue)} hint={`${formatMoney(data.totalRevenue)} all time`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-200)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} stroke="var(--ink-400)" />
                  <YAxis tickFormatter={(v: number) => formatCompactMoney(v)} tick={{ fontSize: 11 }} stroke="var(--ink-400)" />
                  <Tooltip formatter={(value: number) => [formatMoney(value), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--ink-200)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--forest-600)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bookingsByStatus.map((row) => (
              <div key={row.status} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-700">{bookingStatusLabel(row.status)}</span>
                <span className="text-sm font-semibold text-ink-900">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room type performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.roomTypePerformance.map((rt, i) => (
            <div key={rt.roomTypeId} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-sm text-ink-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink-900">{rt.name}</p>
                  <p className="shrink-0 text-sm font-medium text-forest-700">{formatMoney(rt.revenue)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-forest-600"
                    style={{ width: `${data.roomTypePerformance[0]?.revenue ? Math.max(4, Math.round((rt.revenue / data.roomTypePerformance[0].revenue) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ink-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-ink-900">{value}</p>
        <p className="text-xs text-ink-600">{hint}</p>
      </CardContent>
    </Card>
  );
}