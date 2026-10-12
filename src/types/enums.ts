/**
 * Domain enums.
 *
 * These are the exact string values the backend contract uses. The UI must
 * never render a raw enum — use the friendly labels in `src/lib/format.ts`.
 */

/** Who can sign in. Coincides with the seeded demo accounts. */
export type UserRole = 'Customer' | 'Receptionist' | 'Administrator';

/** Physical room unit status. */
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Inactive';

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'Cancelled';

/** How a booking was created. Walk-ins are recorded at the front desk. */
export type BookingSource = 'Online' | 'WalkIn';

/** Staff-recorded cancellation reasons (staff cancel / no-show). */
export type StaffCancellationReason =
  | 'GuestRequest'
  | 'NoShow'
  | 'BookedInError'
  | 'Other';

export type PaymentStatus =
  | 'Pending'
  | 'PartiallyPaid'
  | 'Paid'
  | 'Refunded'
  | 'Failed';

export type PaymentMethod = 'Cash' | 'POS' | 'BankTransfer' | 'Online';

export type NotificationType =
  | 'BookingConfirmed'
  | 'PaymentReceived'
  | 'BookingCancelled'
  | 'CheckInCompleted'
  | 'CheckOutCompleted';

/** Staff roles. Housekeeping/manager roles are out of scope. */
export type StaffRole = 'Receptionist' | 'Administrator';