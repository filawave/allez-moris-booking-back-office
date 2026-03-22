import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookingsByDateRange } from '@/api/bookings';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import BookingDetailDialog from '@/components/calendar/BookingDetailDialog';
import AddBookingDialog from '@/components/calendar/AddBookingDialog';

type ViewType = 'month' | 'week' | 'day';

export default function BookingCalendar() {
  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'month') {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return {
        rangeStart: startOfWeek(ms, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(me, { weekStartsOn: 1 }),
      };
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      return { rangeStart: ws, rangeEnd: addDays(ws, 6) };
    }
    return {
      rangeStart: currentDate,
      rangeEnd: addDays(currentDate, 1),
    };
  }, [view, currentDate]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['calendar-bookings', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () => fetchBookingsByDateRange(rangeStart, rangeEnd),
  });

  useEffect(() => {
    if (isError) {
      toast.error(error instanceof Error ? error.message : 'Failed to load bookings');
    }
  }, [isError, error]);

  const bookings = data?.data ?? [];

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(parseISO(b.startDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings]);

  function navigatePrev() {
    if (view === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  }

  function navigateNext() {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  }

  function goToDay(date: Date) {
    setCurrentDate(date);
    setView('day');
  }

  function getTitle() {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: enUS });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, 'd MMM', { locale: enUS })} – ${format(we, 'd MMM yyyy', { locale: enUS })}`;
    }
    return format(currentDate, 'EEEE, d MMMM yyyy', { locale: enUS });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-background flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground min-w-[200px] text-center">
            {getTitle()}
          </h2>
          <button
            onClick={navigateNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <button
          onClick={() => { setCurrentDate(new Date()); }}
          className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground"
        >
          Today
        </button>

        <div className="ml-auto flex items-center gap-1">
          {(['month', 'week', 'day'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="shrink-0 px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <span className="font-medium">Could not load bookings:</span>
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* View */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            bookingsByDay={bookingsByDay}
            onDayClick={goToDay}
          />
        )}

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            bookingsByDay={bookingsByDay}
            onBookingClick={setSelectedBooking}
            onDayClick={goToDay}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            bookingsByDay={bookingsByDay}
            onBookingClick={setSelectedBooking}
            onAddBooking={() => setShowAddDialog(true)}
            onBackToMonth={() => setView('month')}
          />
        )}
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      <AddBookingDialog
        open={showAddDialog}
        defaultDate={currentDate}
        onClose={() => setShowAddDialog(false)}
        onCreated={() => setShowAddDialog(false)}
      />
    </div>
  );
}
