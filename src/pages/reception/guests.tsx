import { useState } from 'react';
import { useReceptionGuests } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { formatDisplayDate } from '@/lib/dates';
import { Users } from 'lucide-react';

export default function ReceptionGuestsPage() {
  const [search, setSearch] = useState('');
  const guestsQuery = useReceptionGuests({ pageSize: 100, search: search || undefined });
  const guests = guestsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Guests</h1>
          <p className="text-sm text-ink-600">Everyone who has stayed with us.</p>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {guestsQuery.isLoading ? <PageSkeleton rows={5} /> : null}
      {guestsQuery.isError ? <ErrorBanner message="We couldn't load guests" retry={() => guestsQuery.refetch()} /> : null}

      {!guestsQuery.isLoading && !guestsQuery.isError ? (
        guests.length === 0 ? (
          <EmptyState icon={Users} title="No guests found" body="Try a different search." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Joined</TableHead>
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
                      <TableCell className="text-ink-700">{g.createdAt ? formatDisplayDate(g.createdAt) : '—'}</TableCell>
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