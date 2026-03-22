import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Edit3, Loader2, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookings, deleteBooking } from '@/api/bookings';
import type { Booking, BookingFilters, BookingStatus, BookingType, PaymentStatus } from '@/types';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges';
import NewBookingDialog from '@/components/NewBookingDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  car_rental: 'Car rental',
  accommodation: 'Accommodation',
};

const PAGE_SIZE = 25;

export default function BookingList() {
  const [filters, setFilters] = useState<BookingFilters>({
    bookingStatus: 'all',
    paymentStatus: 'all',
    bookingType: 'all',
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteBooking(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      toast.success('Booking deleted');
      setBookingToDelete(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete booking');
      setBookingToDelete(null);
    },
  });

  const queryFilters: BookingFilters = {
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['bookings', queryFilters],
    queryFn: () => fetchBookings(queryFilters),
  });

  const totalPages = data?.meta.pagination.pageCount ?? 1;
  const total = data?.meta.pagination.total ?? 0;

  function resetFilters() {
    setFilters({ bookingStatus: 'all', paymentStatus: 'all', bookingType: 'all' });
    setSearchInput('');
    setPage(1);
  }

  const hasActiveFilters =
    filters.bookingStatus !== 'all' ||
    filters.paymentStatus !== 'all' ||
    filters.bookingType !== 'all';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} booking{total !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setShowNewBooking(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New booking
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search client…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.bookingStatus as string}
            onValueChange={(v) => {
              setFilters((f) => ({ ...f, bookingStatus: v as BookingStatus | 'all' }));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Booking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentStatus as string}
            onValueChange={(v) => {
              setFilters((f) => ({ ...f, paymentStatus: v as PaymentStatus | 'all' }));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paypal_processing">PayPal processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.bookingType as string}
            onValueChange={(v) => {
              setFilters((f) => ({ ...f, bookingType: v as BookingType | 'all' }));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Booking type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="car_rental">Car rental</SelectItem>
              <SelectItem value="accommodation">Accommodation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Start date</th>
                <th className="px-4 py-3 font-medium">End date</th>
                <th className="px-4 py-3 font-medium">Pax</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={10} className="px-5 py-3">
                        <div className="h-5 bg-muted animate-pulse rounded w-full" />
                      </td>
                    </tr>
                  ))
                : data?.data
                    .filter((booking) => {
                      if (!searchInput) return true;
                      const q = searchInput.toLowerCase();
                      const client = booking.client;
                      if (!client) return false;
                      return (
                        client.firstName?.toLowerCase().includes(q) ||
                        client.lastName?.toLowerCase().includes(q) ||
                        client.email?.toLowerCase().includes(q)
                      );
                    })
                    .map((booking) => (
                      <tr
                        key={booking.documentId}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/bookings/${booking.documentId}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {booking.client
                              ? `${booking.client.firstName} ${booking.client.lastName}`
                              : <span className="text-muted-foreground italic">No client</span>}
                          </Link>
                          {booking.client?.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {booking.client.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(booking.startDate), 'd MMM yyyy', { locale: enUS })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {booking.endDate
                            ? format(new Date(booking.endDate), 'd MMM yyyy', { locale: enUS })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {booking.participants}
                        </td>
                        <td className="px-4 py-3">
                          <BookingStatusBadge status={booking.bookingStatus} />
                        </td>
                        <td className="px-4 py-3">
                          {booking.paymentStatus ? (
                            <PaymentStatusBadge status={booking.paymentStatus} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                          €{booking.totalPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: enUS })}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/bookings/${booking.documentId}`)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBookingToDelete(booking)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

              {!isLoading && !isFetching && !data?.data.length && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <NewBookingDialog
        open={showNewBooking}
        onClose={() => setShowNewBooking(false)}
        onCreated={() => setShowNewBooking(false)}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete booking</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this booking
              {bookingToDelete?.client
                ? ` for ${bookingToDelete.client.firstName} ${bookingToDelete.client.lastName}`
                : ''}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBookingToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bookingToDelete && deleteMutation.mutate(bookingToDelete.documentId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
