import { useAdminReports } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton, ErrorBanner } from '@/components/feedback';
import { formatMoney, bookingStatusLabel, paymentMethodLabel } from '@/lib/format';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminReportsPage() {
  const reportsQuery = useAdminReports();
  const data = reportsQuery.data;

  if (reportsQuery.isLoading) return <PageSkeleton rows={4} />;
  if (reportsQuery.isError) return <ErrorBanner message="We couldn't load the reports" retry={() => reportsQuery.refetch()} />;
  if (!data) return null;

  const trend = data.revenueTrend.map((d) => ({ date: d.date.slice(5), revenue: d.revenue }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-2">Reports</h1>
        <p className="text-sm text-muted-foreground">Performance across the month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Occupancy rate" value={`${data.occupancyRate}%`} />
        <StatCard label="Average daily rate" value={formatMoney(data.adr)} />
        <StatCard label="RevPAR" value={formatMoney(data.revpar)} />
        <StatCard label="Average stay" value={`${data.averageStayNights} nights`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-2xl font-semibold text-primary">{formatMoney(data.totalRevenue)}</p>
            {trend.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No revenue recorded this month.</p>
              </div>
            ) : (
              <div className="h-56">
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

        <div className="space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Payments by method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.bookingsByPaymentMethod.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not available from the API.</p>
              ) : (
                data.bookingsByPaymentMethod.map((row) => (
                  <div key={row.paymentMethod} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{paymentMethodLabel(row.paymentMethod)}</span>
                    <span className="text-sm font-semibold text-foreground">{row.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}