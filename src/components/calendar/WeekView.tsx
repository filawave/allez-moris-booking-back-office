import { format, startOfWeek, eachDayOfInterval, addDays, isToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import BookingChip from './BookingChip';

export default function WeekView({
  currentDate,
  bookingsByDay,
  onBookingClick,
  onDayClick,
}: {
  currentDate: Date;
  bookingsByDay: Map<string, Booking[]>;
  onBookingClick: (b: Booking) => void;
  onDayClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border min-h-[500px]">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <div key={key} className="border-r border-border last:border-r-0 flex flex-col">
              <button
                onClick={() => onDayClick(day)}
                className="p-3 border-b border-border text-center hover:bg-muted/50 transition-colors"
              >
                <p className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: enUS })}</p>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mt-0.5',
                    today && 'bg-primary text-primary-foreground',
                    !today && 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </button>

              <div className="p-1.5 space-y-1 flex-1">
                {dayBookings.map((b) => (
                  <BookingChip key={b.documentId} booking={b} onClick={() => onBookingClick(b)} />
                ))}
                {dayBookings.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center pt-4">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
