import { useState } from 'react';
import { useAdminUsers } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { ChangeRoleDialog, type ChangeRoleTarget } from '@/components/change-role-dialog';
import { formatDisplayDate } from '@/lib/dates';
import { roleLabel } from '@/lib/format';
import { UserCog, Users } from 'lucide-react';

const ROLE_OPTIONS = ['Customer', 'Receptionist', 'Administrator'] as const;

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<ChangeRoleTarget | null>(null);
  const query = useAdminUsers({ pageSize: 100, search: search.trim() || undefined });
  const users = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-2">Users</h1>
          <p className="text-sm text-ink-600">Customer accounts. Promote one to staff to give front-desk access.</p>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load users" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" body="Try a different search." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{u.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-ink-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-ink-600">{u.phoneNumber ? `${u.email} · ${u.phoneNumber}` : u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{roleLabel(u.role)}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={u.isActive ? 'success' : 'outline'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                          {!u.emailConfirmed ? <Badge variant="warning">Unverified</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-ink-700">{u.bookingsCount}</TableCell>
                      <TableCell className="text-ink-700">{formatDisplayDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTarget({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), role: u.role })}
                        >
                          <UserCog className="mr-2 h-4 w-4" /> Change role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : null}

      <ChangeRoleDialog
        target={target}
        roles={[...ROLE_OPTIONS]}
        onOpenChange={(open) => { if (!open) setTarget(null); }}
      />
    </div>
  );
}
