import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookingsByDateRange, createBooking } from '@/api/bookings';
import type { Booking, BookingStatus, BookingType, PaymentStatus } from '@/types';
import { BookingStatusBadge, PaymentStatusBadge, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ViewType = 'month' | 'week' | 'day';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  car_rental: 'Car rental',
  accommodation: 'Accommodation',
};

const BOOKING_TYPE_COLORS: Record<string, string> = {
  activity: 'bg-violet-100 border-violet-200 text-violet-800',
  car_rental: 'bg-sky-100 border-sky-200 text-sky-800',
  accommodation: 'bg-amber-100 border-amber-200 text-amber-800',
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

// ── Booking chip for week/day views ──────────────────────────────────────────
function BookingChip({ booking, onClick }: { booking: Booking; onClick: () => void }) {
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

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({
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

  // Max bookings per day in this month (for heatmap scale)
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
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
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

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({
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
              {/* Day header */}
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

              {/* Bookings */}
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

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({
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

// ── Booking Detail Dialog ─────────────────────────────────────────────────────
function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {booking && (
          <>
            <DialogHeader>
              <DialogTitle>Booking details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Client */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                {booking.client ? (
                  <p className="text-sm font-medium text-foreground">
                    {booking.client.firstName} {booking.client.lastName}
                    {booking.client.email && (
                      <span className="block text-xs text-muted-foreground font-normal">
                        {booking.client.email}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No client</p>
                )}
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      BOOKING_TYPE_COLORS[booking.bookingType] ?? 'bg-gray-100 border-gray-200 text-gray-700',
                    )}
                  >
                    {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <BookingStatusBadge status={booking.bookingStatus} />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start</p>
                  <p className="text-sm text-foreground">
                    {format(parseISO(booking.startDate), 'd MMM yyyy, HH:mm', { locale: enUS })}
                  </p>
                </div>
                {booking.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End</p>
                    <p className="text-sm text-foreground">
                      {format(parseISO(booking.endDate), 'd MMM yyyy, HH:mm', { locale: enUS })}
                    </p>
                  </div>
                )}
              </div>

              {/* Participants & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Participants</p>
                  <p className="text-sm text-foreground">{booking.participants}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-semibold text-foreground">€{booking.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Payment */}
              {booking.paymentStatus && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <PaymentStatusBadge status={booking.paymentStatus} />
                </div>
              )}

              {/* PayPal */}
              {(booking.paypalOrderId || booking.paypalCaptureId) && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">PayPal</p>
                  {booking.paypalOrderId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Order ID</p>
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all select-all">
                        {booking.paypalOrderId}
                      </p>
                    </div>
                  )}
                  {booking.paypalCaptureId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Capture ID</p>
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all select-all">
                        {booking.paypalCaptureId}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button size="sm" asChild>
                <Link to={`/bookings/${booking.documentId}`}>
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  View full details
                </Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Add Booking Dialog ────────────────────────────────────────────────────────
const DEFAULT_ADD_FORM = {
  bookingType: 'activity' as BookingType,
  startDate: '',
  endDate: '',
  participants: 1,
  bookingStatus: 'pending' as BookingStatus,
  paymentStatus: '' as PaymentStatus | '',
  totalPrice: 0,
};

function AddBookingDialog({
  open,
  defaultDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    ...DEFAULT_ADD_FORM,
    startDate: format(defaultDate, "yyyy-MM-dd'T'HH:mm"),
  }));
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createBooking({
        bookingType: form.bookingType,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        participants: form.participants,
        bookingStatus: form.bookingStatus,
        paymentStatus: form.paymentStatus || undefined,
        totalPrice: form.totalPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created');
      onCreated();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    },
  });

  function handleClose() {
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={form.bookingType}
              onValueChange={(v) => setForm((f) => ({ ...f, bookingType: v as BookingType }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="car_rental">Car rental</SelectItem>
                <SelectItem value="accommodation">Accommodation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start date & time</Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End date & time (optional)</Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Participants */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Participants</Label>
              <Input
                type="number"
                min={1}
                value={form.participants}
                onChange={(e) => setForm((f) => ({ ...f, participants: Number(e.target.value) }))}
              />
            </div>

            {/* Total price */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Total price (€)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.totalPrice}
                onChange={(e) => setForm((f) => ({ ...f, totalPrice: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Booking status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Booking status</Label>
            <Select
              value={form.bookingStatus}
              onValueChange={(v) => setForm((f) => ({ ...f, bookingStatus: v as BookingStatus }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment status (optional)</Label>
            <Select
              value={form.paymentStatus}
              onValueChange={(v) => setForm((f) => ({ ...f, paymentStatus: v as PaymentStatus | '' }))}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.startDate}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingCalendar() {
  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Compute query date range based on view
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
    // day
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

  function goToMonth() {
    setView('month');
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
            onBackToMonth={goToMonth}
          />
        )}
      </div>

      {/* Booking detail dialog */}
      <BookingDetailDialog
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      {/* Add booking dialog */}
      <AddBookingDialog
        open={showAddDialog}
        defaultDate={currentDate}
        onClose={() => setShowAddDialog(false)}
        onCreated={() => setShowAddDialog(false)}
      />
    </div>
  );
}
