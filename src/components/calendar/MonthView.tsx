import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import { WEEK_DAYS } from './constants';

function getHeatClass(count: number, max: number): string {
  if (count === 0 || max === 0) return '';
  const ratio = count / max;
  if (ratio <= 0.25) return 'bg-emerald-100';
  if (ratio <= 0.5) return 'bg-emerald-200';
  if (ratio <= 0.75) return 'bg-emerald-400';
  return 'bg-emerald-600';
}

function getHeatTextClass(count: number, max: number): string {
  if (count === 0 || max === 0) return '';
  const ratio = count / max;
  return ratio > 0.5 ? 'text-emerald-900' : '';
}

export default function MonthView({
  currentDate,
  bookingsByDay,
  onDayClick,
}: {
  currentDate: Date;
  bookingsByDay: Map<string, Booking[]>;
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const max = useMemo(() => {
    let m = 0;
    for (const day of days) {
      if (!isSameMonth(day, currentDate)) continue;
      const key = format(day, 'yyyy-MM-dd');
      const count = bookingsByDay.get(key)?.length ?? 0;
      if (count > m) m = count;
    }
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsByDay, currentDate]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay.get(key) ?? [];
          const count = dayBookings.length;
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const heatClass = inMonth ? getHeatClass(count, max) : '';
          const heatText = inMonth ? getHeatTextClass(count, max) : '';

          return (
            <button
              key={key}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[90px] p-2 border-b border-r border-border text-left transition-all',
                'hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-inset',
                !inMonth && 'opacity-30 cursor-default',
                inMonth && heatClass,
              )}
              disabled={!inMonth}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground',
                  !today && heatText,
                  !today && !heatClass && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {count > 0 && inMonth && (
                <div className="mt-1">
                  <span className={cn('text-xs font-semibold', heatText)}>
                    {count} booking{count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
