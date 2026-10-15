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
 * Totals are never computed here — every surface prices through the backend.
 */
export interface BookingDraft {
  request: CreateBookingRequest;
  lines: BookingSummaryLine[];
  nights: number;
}

/** Router state passed between /book → guest details → review. */
export interface BookingFlowState {
  draft: BookingDraft;
  idempotencyKey: string;
}
