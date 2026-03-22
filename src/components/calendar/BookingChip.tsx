import { format, parseISO } from 'date-fns';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import { BOOKING_TYPE_COLORS, BOOKING_TYPE_LABELS } from './constants';

export default function BookingChip({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left text-xs px-2 py-1 rounded border truncate transition-opacity hover:opacity-80',
        BOOKING_TYPE_COLORS[booking.bookingType] ?? 'bg-gray-100 border-gray-200 text-gray-800',
      )}
    >
      <span className="font-medium">
        {format(parseISO(booking.startDate), 'HH:mm')}
      </span>{' '}
      {booking.client
        ? `${booking.client.firstName} ${booking.client.lastName}`
        : BOOKING_TYPE_LABELS[booking.bookingType]}
    </button>
  );
}
