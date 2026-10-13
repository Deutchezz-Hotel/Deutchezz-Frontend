import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Shared badge variants. Status semantics use the soft tokens so booking,
 * payment and room statuses read the same in light and dark themes:
 *   Confirmed / PartiallyPaid -> info
 *   Pending                   -> warning
 *   CheckedIn / Paid          -> success
 *   CheckedOut / Refunded     -> neutral
 *   Cancelled / Failed        -> destructive-soft
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary-hover',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow',
        'destructive-soft':
          'border-transparent bg-destructive-soft text-destructive-soft-foreground',
        success:
          'border-transparent bg-success-soft text-success',
        warning:
          'border-transparent bg-warning-soft text-warning',
        info:
          'border-transparent bg-info-soft text-info',
        neutral:
          'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
