/**
 * Display status for booking UI: distinguishes "In attesa" (future) from "Non completato" (past, never completed/cancelled).
 */
export type BookingDisplayStatus =
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'incomplete'
  | 'no_show';

export interface BookingForDisplayStatus {
  status: string;
  booking_date: string;
}

/**
 * Maps raw booking status + date to display status for KPI and lists.
 * Past bookings that are still pending/confirmed are "incomplete", not "pending".
 */
export function getDisplayStatus(
  booking: BookingForDisplayStatus
): BookingDisplayStatus {
  const today = new Date().toISOString().split('T')[0];
  const isPast = booking.booking_date < today;

  if (booking.status === 'completed') return 'completed';
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.status === 'no_show') return 'no_show';

  if (
    isPast &&
    (booking.status === 'pending' || booking.status === 'confirmed')
  ) {
    return 'incomplete';
  }

  return 'pending';
}

/** Badge label and Tailwind classes for each display status */
export const bookingDisplayStatusConfig: Record<
  BookingDisplayStatus,
  { label: string; className: string }
> = {
  completed: { label: 'Completato', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancellato', className: 'bg-red-100 text-red-700' },
  pending: { label: 'In attesa', className: 'bg-yellow-100 text-yellow-700' },
  incomplete: {
    label: 'Non completato',
    className: 'bg-orange-100 text-orange-700',
  },
  no_show: { label: 'Non presentato', className: 'bg-gray-100 text-gray-700' },
};
