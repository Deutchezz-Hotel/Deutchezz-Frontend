import { useState } from 'react';
import { useAdminGuests } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatDisplayDate } from '@/lib/dates';
import { Users } from 'lucide-react';

export default function AdminGuestsPage() {
  const [search, setSearch] = useState('');
  const query = useAdminGuests({ pageSize: 100, search: search || undefined });
  const guests = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Guests</h1>
          <p className="text-sm text-ink-600">Everyone who has stayed with us.</p>
        </div>
        <Input className="w-full sm:w-64" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load guests" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        guests.length === 0 ? (
          <EmptyState icon={Users} title="No guests found" body="Try a different search." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Stays</TableHead>
                    <TableHead>Last stay</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{g.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-ink-900">{g.firstName} {g.lastName}</p>
                            <p className="text-xs text-ink-600">{g.email} · {g.phoneNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-ink-700">{g.totalBookings}</TableCell>
                      <TableCell className="text-ink-700">{g.lastStayDate ? formatDisplayDate(g.lastStayDate) : '—'}</TableCell>
                      <TableCell className="text-ink-700">{g.currentRoomNumbers?.join(', ') ?? '—'}</TableCell>
                      <TableCell>
                        {g.inHouse ? <Badge variant="success">In house</Badge> : <Badge variant="secondary">Not staying</Badge>}
                      </TableCell>
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