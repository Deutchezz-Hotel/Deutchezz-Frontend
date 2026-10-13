import type { BookingStatus, PaymentStatus, RoomStatus } from '@/types';

/** Soft-token badge tone used by status badges across every portal. */
export type StatusTone = 'info' | 'warning' | 'success' | 'neutral' | 'destructive-soft';

export function bookingStatusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case 'Confirmed':
      return 'info';
    case 'Pending':
      return 'warning';
    case 'CheckedIn':
      return 'success';
    case 'CheckedOut':
      return 'neutral';
    case 'Cancelled':
      return 'destructive-soft';
  }
}

export function paymentStatusTone(status: PaymentStatus): StatusTone {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'PartiallyPaid':
      return 'info';
    case 'Paid':
      return 'success';
    case 'Refunded':
      return 'neutral';
    case 'Failed':
      return 'destructive-soft';
  }
}

export function roomStatusTone(status: RoomStatus): StatusTone {
  switch (status) {
    case 'Available':
      return 'success';
    case 'Occupied':
      return 'info';
    case 'Maintenance':
      return 'warning';
    case 'Inactive':
      return 'neutral';
  }
}
