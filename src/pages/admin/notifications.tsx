import { useAdminNotifications } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { notificationTypeLabel } from '@/lib/format';
import { formatDisplayDate } from '@/lib/dates';
import { Bell } from 'lucide-react';

export default function AdminNotificationsPage() {
  const query = useAdminNotifications({ pageSize: 50 });
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2">Notifications</h1>
        <p className="text-sm text-muted-foreground">Things that happened recently, like check-ins and payments.</p>
      </div>

      {query.isLoading ? <PageSkeleton rows={5} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load notifications" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground">{formatDisplayDate(n.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!n.isRead ? <span className="h-2 w-2 rounded-full bg-forest-600" aria-label="Unread" /> : null}
                      <Badge variant="secondary">{notificationTypeLabel(n.type)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      ) : null}
    </div>
  );
}