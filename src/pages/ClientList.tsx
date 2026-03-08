import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { fetchClients } from '@/api/clients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 25;

export default function ClientList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Simple debounce via onChange
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => setDebouncedSearch(value), 400);
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', debouncedSearch, page],
    queryFn: () => fetchClients({ search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE }),
  });

  const totalPages = data?.meta.pagination.pageCount ?? 1;
  const total = data?.meta.pagination.total ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} client{total !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td colSpan={4} className="px-5 py-3">
                        <div className="h-5 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                : data?.data.map((client) => (
                    <tr
                      key={client.documentId}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/clients/${client.documentId}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {client.firstName} {client.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{client.phoneNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {client.createdAt
                          ? format(new Date(client.createdAt), 'd MMM yyyy', { locale: fr })
                          : '—'}
                      </td>
                    </tr>
                  ))}

              {!isLoading && !isFetching && !data?.data.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    Aucun client trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

let searchTimeout: ReturnType<typeof setTimeout>;
