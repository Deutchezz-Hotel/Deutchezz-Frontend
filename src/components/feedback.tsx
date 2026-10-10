import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingSkeleton({ className = 'h-10 w-full', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-ink-100 ${className}`} {...props} />;
}

export function PageSkeleton() {
  return (
    <div className="container-x section-pad space-y-6">
      <LoadingSkeleton className="h-8 w-1/2" />
      <LoadingSkeleton className="h-4 w-2/3" />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <LoadingSkeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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