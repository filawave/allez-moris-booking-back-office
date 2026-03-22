import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import type { Booking } from '@/types';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BOOKING_TYPE_COLORS, BOOKING_TYPE_LABELS } from './constants';

export default function BookingDetailDialog({
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

              {booking.paymentStatus && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <PaymentStatusBadge status={booking.paymentStatus} />
                </div>
              )}

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
