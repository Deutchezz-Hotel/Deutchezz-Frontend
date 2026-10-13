import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function LoadingSkeleton({ className = 'h-10 w-full', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} {...props} />;
}

export function PageSkeleton({ rows = 3 }: { rows?: number } = {}) {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-8 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon?: LucideIcon; title: string; body?: string; action?: { label: string; to: string } }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      {Icon ? <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /> : null}
      <p className="font-medium text-foreground">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? (
        <Button asChild size="sm" className="mt-4">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorBanner({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-text">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <div className="flex-1 space-y-2">
        <p>{message}</p>
        {retry ? (
          <Button size="sm" variant="outline" onClick={retry}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  body,
  retry,
  retryLabel = 'Try again',
}: {
  icon?: LucideIcon;
  title?: string;
  body?: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-10 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-destructive-text/70" />
      <p className="font-medium text-foreground">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {retry ? (
        <Button size="sm" variant="outline" className="mt-4" onClick={retry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function UnavailableState({
  title = 'Not available yet',
  body = 'This feature is not available on the server yet. Please check back later.',
  retry,
}: {
  title?: string;
  body?: string;
  retry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="mx-auto font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {retry ? (
        <Button size="sm" variant="outline" className="mt-4" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}