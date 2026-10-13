import { useAdminActivity } from '@/hooks/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton, ErrorBanner, EmptyState } from '@/components/feedback';
import { activityTypeLabel } from '@/lib/format';
import { formatDisplayDate } from '@/lib/dates';
import { Activity } from 'lucide-react';

export default function AdminActivityPage() {
  const query = useAdminActivity({ pageSize: 50 });
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2">Activity log</h1>
        <p className="text-sm text-muted-foreground">A running record of important events, newest first.</p>
      </div>

      {query.isLoading ? <PageSkeleton rows={6} /> : null}
      {query.isError ? <ErrorBanner message="We couldn't load the activity log" retry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        items.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {items.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground">by {log.actorName} · {formatDisplayDate(log.timestamp)}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{activityTypeLabel(log.type)}</Badge>
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