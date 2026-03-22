import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Booking } from '@/types';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BOOKING_TYPE_COLORS, BOOKING_TYPE_LABELS } from './constants';

export default function DayView({
  currentDate,
  bookingsByDay,
  onBookingClick,
  onAddBooking,
  onBackToMonth,
}: {
  currentDate: Date;
  bookingsByDay: Map<string, Booking[]>;
  onBookingClick: (b: Booking) => void;
  onAddBooking: () => void;
  onBackToMonth: () => void;
}) {
  const key = format(currentDate, 'yyyy-MM-dd');
  const dayBookings = bookingsByDay.get(key) ?? [];

  return (
    <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBackToMonth}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Month overview
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: enUS })}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={onAddBooking}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add booking
        </Button>
      </div>

      {dayBookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No bookings for this day.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onAddBooking}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add a booking
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {dayBookings.map((booking) => (
            <button
              key={booking.documentId}
              onClick={() => onBookingClick(booking)}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {format(parseISO(booking.startDate), 'HH:mm', { locale: enUS })}
                      {booking.endDate && (
                        <span className="text-muted-foreground font-normal">
                          {' → '}
                          {format(parseISO(booking.endDate), 'HH:mm', { locale: enUS })}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        BOOKING_TYPE_COLORS[booking.bookingType] ?? 'bg-gray-100 border-gray-200 text-gray-700',
                      )}
                    >
                      {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
                    </span>
                  </div>

                  <p className="text-sm text-foreground font-medium truncate">
                    {booking.client
                      ? `${booking.client.firstName} ${booking.client.lastName}`
                      : <span className="text-muted-foreground italic">No client</span>}
                  </p>
                  {booking.client?.email && (
                    <p className="text-xs text-muted-foreground truncate">{booking.client.email}</p>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <BookingStatusBadge status={booking.bookingStatus} />
                  <p className="text-sm font-semibold text-foreground">€{booking.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
