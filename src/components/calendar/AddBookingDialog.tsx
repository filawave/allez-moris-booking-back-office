import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBooking } from '@/api/bookings';
import type { BookingStatus, BookingType, PaymentStatus } from '@/types';
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/components/StatusBadges';
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

const DEFAULT_ADD_FORM = {
  bookingType: 'activity' as BookingType,
  startDate: '',
  endDate: '',
  participants: 1,
  bookingStatus: 'pending' as BookingStatus,
  paymentStatus: '' as PaymentStatus | '',
  totalPrice: 0,
};

export default function AddBookingDialog({
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

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start date & time</Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End date & time (optional)</Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Participants</Label>
              <Input
                type="number"
                min={1}
                value={form.participants}
                onChange={(e) => setForm((f) => ({ ...f, participants: Number(e.target.value) }))}
              />
            </div>
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
