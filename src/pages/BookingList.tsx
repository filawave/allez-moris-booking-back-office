import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { fetchBookings } from '@/api/bookings';
import type { BookingFilters, BookingStatus, BookingType, PaymentStatus } from '@/types';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BOOKING_TYPE_LABELS: Record<string, string> = {
  activity: 'Activité',
  car_rental: 'Location voiture',
  accommodation: 'Hébergement',
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Réservations</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} réservation{total !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtres</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search (client-side hint — Strapi doesn't support cross-relation search easily) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un client…"
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
              <SelectValue placeholder="Statut réservation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
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
              <SelectValue placeholder="Statut paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les paiements</SelectItem>
              <SelectItem value="unpaid">Non payé</SelectItem>
              <SelectItem value="paypal_processing">PayPal en cours</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="refunded">Remboursé</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
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
              <SelectValue placeholder="Type de réservation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="activity">Activité</SelectItem>
              <SelectItem value="car_rental">Location voiture</SelectItem>
              <SelectItem value="accommodation">Hébergement</SelectItem>
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
                <th className="px-4 py-3 font-medium">Date début</th>
                <th className="px-4 py-3 font-medium">Date fin</th>
                <th className="px-4 py-3 font-medium">Pers.</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Paiement</th>
                <th className="px-4 py-3 font-medium text-right">Montant</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={9} className="px-5 py-3">
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
                              : <span className="text-muted-foreground italic">Sans client</span>}
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
                          {format(new Date(booking.startDate), 'd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {booking.endDate
                            ? format(new Date(booking.endDate), 'd MMM yyyy', { locale: fr })
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
                          {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: fr })}
                        </td>
                      </tr>
                    ))}

              {!isLoading && !isFetching && !data?.data.length && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    Aucune réservation trouvée
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
              Page {page} sur {totalPages}
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
    </div>
  );
}
