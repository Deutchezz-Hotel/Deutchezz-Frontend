import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

export function ActionButton({ loading, children, ...props }: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function AddButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      <Plus className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="heading-3 mb-2">{title}</h3>
      <p className="mb-6 max-w-lg text-ink-600">{description}</p>
      {action}
    </div>
  );
}