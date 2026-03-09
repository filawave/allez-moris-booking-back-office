import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft, Loader2, Mail, Phone } from 'lucide-react';
import { fetchClientByDocumentId } from '@/api/clients';
import { fetchBookings } from '@/api/bookings';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  car_rental: 'Car rental',
  accommodation: 'Accommodation',
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: clientData, isLoading: clientLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientByDocumentId(id!),
    enabled: !!id,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['client-bookings', id],
    queryFn: () =>
      fetchBookings({ pageSize: 50 }).then((res) => ({
        ...res,
        data: res.data.filter((b) => b.client?.documentId === id),
      })),
    enabled: !!id,
  });

  if (clientLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">Client not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  const client = clientData.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/clients"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Clients

        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">
          {client.firstName} {client.lastName}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-base font-semibold text-primary">
                {client.firstName[0]}{client.lastName[0]}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">{client.documentId}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{client.phoneNumber}</span>
                </div>
              )}
            </div>

            {client.createdAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Client since{' '}
                {format(new Date(client.createdAt), 'd MMMM yyyy', { locale: enUS })}
              </p>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Bookings</h2>
            </div>

            {bookingsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsData?.data.map((booking) => (
                      <tr
                        key={booking.documentId}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/bookings/${booking.documentId}`}
                            className="text-primary hover:underline"
                          >
                            {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(booking.startDate), 'd MMM yyyy', { locale: enUS })}
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
                        <td className="px-4 py-3 text-right font-medium">
                          €{booking.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!bookingsLoading && !bookingsData?.data.length && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">
                          No bookings
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
