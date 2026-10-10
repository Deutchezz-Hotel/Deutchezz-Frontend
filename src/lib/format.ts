import { appConfig } from '@/config/appConfig';
import type {
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
  UserRole,
} from '@/types';

/**
 * Format money as Naira using the configured locale.
 * Whole naira amounts render without decimals; partial amounts keep two.
 */
export function formatMoney(amount: number): string {
  const hasFraction = amount % 1 !== 0;
  return new Intl.NumberFormat(appConfig.locale, {
    style: 'currency',
    currency: appConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(amount);
}

export function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toLocaleString(appConfig.locale, { maximumFractionDigits: 2 })}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toLocaleString(appConfig.locale, { maximumFractionDigits: 1 })}k`;
  }
  return formatMoney(amount);
}

const bookingStatusLabels: Record<BookingStatus, string> = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  CheckedIn: 'Checked in',
  CheckedOut: 'Checked out',
  Cancelled: 'Cancelled',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  Pending: 'Pending',
  PartiallyPaid: 'Partially paid',
  Paid: 'Paid',
  Refunded: 'Refunded',
  Failed: 'Failed',
};

const roomStatusLabels: Record<RoomStatus, string> = {
  Available: 'Available',
  Occupied: 'Occupied',
  Maintenance: 'Maintenance',
  Inactive: 'Inactive',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  Cash: 'Cash',
  POS: 'POS',
  BankTransfer: 'Bank transfer',
  Online: 'Online',
};

const notificationTypeLabels: Record<NotificationType, string> = {
  BookingConfirmed: 'Booking confirmed',
  PaymentReceived: 'Payment received',
  BookingCancelled: 'Booking cancelled',
  CheckInCompleted: 'Check-in completed',
  CheckOutCompleted: 'Check-out completed',
};

const roleLabels: Record<UserRole, string> = {
  Customer: 'Guest',
  Receptionist: 'Receptionist',
  Administrator: 'Administrator',
};

export function bookingStatusLabel(status: BookingStatus): string {
  return bookingStatusLabels[status];
}
export function paymentStatusLabel(status: PaymentStatus): string {
  return paymentStatusLabels[status];
}
export function roomStatusLabel(status: RoomStatus): string {
  return roomStatusLabels[status];
}
export function paymentMethodLabel(method: PaymentMethod): string {
  return paymentMethodLabels[method];
}
export function notificationTypeLabel(type: NotificationType): string {
  return notificationTypeLabels[type];
}
export function roleLabel(role: UserRole): string {
  return roleLabels[role];
}