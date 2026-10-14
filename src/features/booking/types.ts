import type { CreateBookingRequest } from '@/types';

/** A single room line retained for display while the guest moves through checkout. */
export interface BookingSummaryLine {
  roomTypeId: string;
  name: string;
  pricePerNight: number;
  quantity: number;
}

/**
 * The in-progress booking. `request` is exactly what gets POSTed; `lines` and
 * `nights` carry display data (names/rates) the API request deliberately omits.
 */
export interface BookingDraft {
  request: CreateBookingRequest;
  lines: BookingSummaryLine[];
  nights: number;
  /** Estimated late check-out surcharge for the draft (0 if none). */
  extraChargeAmount?: number;
}

/** Router state passed between /book → guest details → review. */
export interface BookingFlowState {
  draft: BookingDraft;
  idempotencyKey: string;
}

/** Estimated total for display only — the server is the source of truth. */
export function estimateTotal(draft: BookingDraft): number {
  return draft.lines.reduce((sum, line) => sum + line.pricePerNight * line.quantity * draft.nights, 0);
}
