import { formatMoney } from '@/lib/format';
import { extendedStayLabel, gracePeriodNote, isWithinGrace, WITHIN_GRACE_NOTE } from '@/lib/pricing';

interface ExtendedStayChargeProps {
  /** Whole minutes of the stay beyond nights × 24 h (0 when none applies). */
  overageMinutes: number;
  /** Amount stored on the booking for this charge (0 inside the grace period). */
  amount: number;
  /** Free grace period read from settings. */
  graceHours: number;
}

/**
 * The single, shared rendering of the extra-stay charge: nothing when there is
 * no overage, a small note inside the grace period, otherwise the labelled
 * charge plus the grace explanation. Used on every guest and staff surface so
 * the wording can never drift.
 */
export function ExtendedStayCharge({ overageMinutes, amount, graceHours }: ExtendedStayChargeProps) {
  if (overageMinutes <= 0) return null;

  if (isWithinGrace(overageMinutes, graceHours)) {
    return <p className="text-xs text-muted-foreground">{WITHIN_GRACE_NOTE}</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span>{extendedStayLabel(overageMinutes)}</span>
        <span>{formatMoney(amount)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{gracePeriodNote(graceHours)}</p>
    </div>
  );
}
