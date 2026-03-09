import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Euro, TrendingUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { fetchBookingStats, fetchBookings } from '@/api/bookings';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: fetchBookingStats,
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['bookings', 'recent'],
    queryFn: () => fetchBookings({ pageSize: 8 }),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Bookings overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total bookings"
          value={stats?.total ?? 0}
          icon={TrendingUp}
          color="bg-primary/10 text-primary"
          loading={statsLoading}
        />
        <StatCard
          label="Pending"
          value={stats?.pending ?? 0}
          icon={Clock}
          color="bg-warning/10 text-warning"
          loading={statsLoading}
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmed ?? 0}
          icon={CheckCircle2}
          color="bg-success/10 text-success"
          loading={statsLoading}
        />
        <StatCard
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          icon={XCircle}
          color="bg-destructive/10 text-destructive"
          loading={statsLoading}
        />
        <StatCard
          label="Revenue (paid)"
          value={stats ? `€${stats.revenue.toFixed(0)}` : '—'}
          icon={Euro}
          color="bg-emerald-500/10 text-emerald-600"
          loading={statsLoading}
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent bookings</h2>
          </div>
          <Link to="/bookings" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>

        {recentLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Start date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentData?.data.map((booking) => (
                  <tr
                    key={booking.documentId}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/bookings/${booking.documentId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {booking.client
                          ? `${booking.client.firstName} ${booking.client.lastName}`
                          : '—'}
                      </Link>
                      {booking.client?.email && (
                        <p className="text-xs text-muted-foreground">{booking.client.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-muted-foreground">
                        {BOOKING_TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
                {!recentData?.data.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
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
  );
}

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  car_rental: 'Car rental',
  accommodation: 'Accommodation',
};
