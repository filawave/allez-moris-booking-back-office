import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft, Edit3, Loader2, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBookingByDocumentId, updateBooking, deleteBooking } from '@/api/bookings';
import type { BookingStatus, BookingType, PaymentStatus } from '@/types';
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
  DialogDescription,
} from '@/components/ui/dialog';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  car_rental: 'Car rental',
  accommodation: 'Accommodation',
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<{
    bookingType: BookingType;
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus | '';
    participants: number;
    startDate: string;
    endDate: string;
    totalPrice: number;
  } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingByDocumentId(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateBooking>[1]) => updateBooking(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setEditing(false);
      setSaveError('');
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Save error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      toast.success('Booking deleted');
      navigate('/bookings');
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Delete error');
      setShowDeleteDialog(false);
    },
  });

  function startEditing() {
    if (!booking) return;
    setEditData({
      bookingType: booking.bookingType,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus ?? '',
      participants: booking.participants,
      startDate: booking.startDate.slice(0, 16),
      endDate: booking.endDate ? booking.endDate.slice(0, 16) : '',
      totalPrice: booking.totalPrice,
    });
    setEditing(true);
    setSaveError('');
  }

  function cancelEditing() {
    setEditing(false);
    setEditData(null);
    setSaveError('');
  }

  function handleSave() {
    if (!editData) return;
    const payload: Parameters<typeof updateBooking>[1] = {
      bookingType: editData.bookingType,
      bookingStatus: editData.bookingStatus,
      participants: editData.participants,
      startDate: editData.startDate ? new Date(editData.startDate).toISOString() : undefined,
      endDate: editData.endDate ? new Date(editData.endDate).toISOString() : undefined,
      totalPrice: editData.totalPrice,
    };
    if (editData.paymentStatus) {
      payload.paymentStatus = editData.paymentStatus as PaymentStatus;
    }
    mutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : 'Booking not found'}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  const booking = data.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/bookings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Bookings
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground truncate max-w-xs">
          {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : booking.documentId}
        </span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Booking — {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{booking.documentId}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={mutation.isPending}>
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Booking Details */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Booking details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Booking Type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Booking type</Label>
                {editing && editData ? (
                  <Select
                    value={editData.bookingType}
                    onValueChange={(v) => setEditData((d) => d && { ...d, bookingType: v as BookingType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BOOKING_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground pt-1">{BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}</p>
                )}
              </div>

              {/* Booking Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Booking status</Label>
                {editing && editData ? (
                  <Select
                    value={editData.bookingStatus}
                    onValueChange={(v) => setEditData((d) => d && { ...d, bookingStatus: v as BookingStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="pt-1"><BookingStatusBadge status={booking.bookingStatus} /></div>
                )}
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Payment status</Label>
                {editing && editData ? (
                  <Select
                    value={editData.paymentStatus}
                    onValueChange={(v) => setEditData((d) => d && { ...d, paymentStatus: v as PaymentStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="pt-1">
                    {booking.paymentStatus ? (
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start date</Label>
                {editing && editData ? (
                  <Input
                    type="datetime-local"
                    value={editData.startDate}
                    onChange={(e) => setEditData((d) => d && { ...d, startDate: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {format(new Date(booking.startDate), 'd MMMM yyyy, HH:mm', { locale: enUS })}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End date</Label>
                {editing && editData ? (
                  <Input
                    type="datetime-local"
                    value={editData.endDate}
                    onChange={(e) => setEditData((d) => d && { ...d, endDate: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {booking.endDate
                      ? format(new Date(booking.endDate), 'd MMMM yyyy, HH:mm', { locale: enUS })
                      : '—'}
                  </p>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Participants</Label>
                {editing && editData ? (
                  <Input
                    type="number"
                    min={1}
                    value={editData.participants}
                    onChange={(e) => setEditData((d) => d && { ...d, participants: Number(e.target.value) })}
                  />
                ) : (
                  <p className="text-sm text-foreground">{booking.participants}</p>
                )}
              </div>

              {/* Total Price */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Total amount (€)</Label>
                {editing && editData ? (
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={editData.totalPrice}
                    onChange={(e) => setEditData((d) => d && { ...d, totalPrice: Number(e.target.value) })}
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground">€{booking.totalPrice.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>

          {/* PayPal Info */}
          {(booking.paypalOrderId || booking.paypalCaptureId) && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">PayPal details</h2>
              <div className="space-y-3">
                {booking.paypalOrderId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                    <p className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded-lg break-all">
                      {booking.paypalOrderId}
                    </p>
                  </div>
                )}
                {booking.paypalCaptureId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capture ID</p>
                    <p className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded-lg break-all">
                      {booking.paypalCaptureId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Client</h2>
            {booking.client ? (
              <div className="space-y-2">
                <Link
                  to={`/clients/${booking.client.documentId}`}
                  className="font-medium text-primary hover:underline block"
                >
                  {booking.client.firstName} {booking.client.lastName}
                </Link>
                <p className="text-sm text-muted-foreground">{booking.client.email}</p>
                {booking.client.phoneNumber && (
                  <p className="text-sm text-muted-foreground">{booking.client.phoneNumber}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono mt-2">{booking.client.documentId}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No client linked</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Metadata</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-foreground">
                  {format(new Date(booking.createdAt), 'd MMM yyyy, HH:mm', { locale: enUS })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-foreground">
                  {format(new Date(booking.updatedAt), 'd MMM yyyy, HH:mm', { locale: enUS })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Document ID</p>
                <p className="text-foreground font-mono text-xs">{booking.documentId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete booking</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this booking
              {booking.client
                ? ` for ${booking.client.firstName} ${booking.client.lastName}`
                : ''}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate()}
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
