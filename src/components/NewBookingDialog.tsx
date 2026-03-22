import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Loader2, Search, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { createBooking } from '@/api/bookings';
import { fetchClients, createClient } from '@/api/clients';
import type { BookingStatus, BookingType, Client, PaymentStatus } from '@/types';
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

type ClientMode = 'existing' | 'new';

const DEFAULT_BOOKING_FORM = {
  bookingType: 'activity' as BookingType,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  participants: 1,
  bookingStatus: 'pending' as BookingStatus,
  paymentStatus: '' as PaymentStatus | '',
  totalPrice: 0,
};

const DEFAULT_NEW_CLIENT = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

function buildISO(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const dt = time ? `${date}T${time}` : `${date}T00:00`;
  return new Date(dt).toISOString();
}

export default function NewBookingDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [clientMode, setClientMode] = useState<ClientMode>('existing');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [newClient, setNewClient] = useState(DEFAULT_NEW_CLIENT);
  const [form, setForm] = useState(DEFAULT_BOOKING_FORM);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce client search
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(clientSearch), 400);
    return () => clearTimeout(debounceRef.current);
  }, [clientSearch]);

  // Fetch existing clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', debouncedSearch, 1],
    queryFn: () => fetchClients({ search: debouncedSearch || undefined, pageSize: 50 }),
    enabled: open && clientMode === 'existing' && showClientList,
  });

  const clients = clientsData?.data ?? [];

  const createClientMutation = useMutation({
    mutationFn: () => createClient({
      firstName: newClient.firstName.trim(),
      lastName: newClient.lastName.trim(),
      email: newClient.email.trim(),
      phoneNumber: newClient.phoneNumber.trim() || undefined,
    }),
  });

  const createBookingMutation = useMutation({
    mutationFn: (clientDocumentId?: string) =>
      createBooking({
        bookingType: form.bookingType,
        startDate: buildISO(form.startDate, form.startTime)!,
        endDate: buildISO(form.endDate, form.endTime),
        participants: form.participants,
        bookingStatus: form.bookingStatus,
        paymentStatus: form.paymentStatus || undefined,
        totalPrice: form.totalPrice,
        client: clientDocumentId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Booking created');
      onCreated();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    },
  });

  const isPending = createClientMutation.isPending || createBookingMutation.isPending;

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setClientSearch(`${client.firstName} ${client.lastName}`);
    setShowClientList(false);
  }

  function handleClearClient() {
    setSelectedClient(null);
    setClientSearch('');
    setShowClientList(true);
  }

  async function handleSubmit() {
    setError('');

    if (!form.startDate) {
      setError('Start date is required');
      return;
    }

    try {
      let clientDocumentId: string | undefined;

      if (clientMode === 'existing' && selectedClient) {
        clientDocumentId = selectedClient.documentId;
      } else if (clientMode === 'new') {
        if (!newClient.firstName.trim() || !newClient.lastName.trim() || !newClient.email.trim()) {
          setError('First name, last name and email are required for a new client');
          return;
        }
        const res = await createClientMutation.mutateAsync();
        clientDocumentId = res.data.documentId;
      }

      await createBookingMutation.mutateAsync(clientDocumentId);
    } catch {
      // errors are handled in mutation onError
    }
  }

  function handleClose() {
    setError('');
    setForm(DEFAULT_BOOKING_FORM);
    setNewClient(DEFAULT_NEW_CLIENT);
    setSelectedClient(null);
    setClientSearch('');
    setShowClientList(false);
    setClientMode('existing');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Client section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Client</Label>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setClientMode('existing'); setShowClientList(!selectedClient); }}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                    clientMode === 'new'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  New
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setSelectedClient(null);
                      setShowClientList(true);
                    }}
                    onFocus={() => { if (!selectedClient) setShowClientList(true); }}
                    className={`pl-9 ${selectedClient ? 'pr-8 border-primary/40 bg-primary/5' : ''}`}
                  />
                  {selectedClient && (
                    <button
                      type="button"
                      onClick={handleClearClient}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showClientList && !selectedClient && (
                  <div className="border border-border rounded-lg max-h-[160px] overflow-y-auto">
                    {clientsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No clients found.{' '}
                        <button
                          type="button"
                          onClick={() => setClientMode('new')}
                          className="text-primary hover:underline"
                        >
                          Create one
                        </button>
                      </div>
                    ) : (
                      clients.map((client) => (
                        <button
                          key={client.documentId}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left px-3 py-2 text-sm border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium">
                            {client.firstName} {client.lastName}
                          </span>
                          <span className="block text-xs text-muted-foreground">{client.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-muted/30 border border-border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">First name *</Label>
                    <Input
                      value={newClient.firstName}
                      onChange={(e) => setNewClient((c) => ({ ...c, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Last name *</Label>
                    <Input
                      value={newClient.lastName}
                      onChange={(e) => setNewClient((c) => ({ ...c, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email *</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone (optional)</Label>
                  <Input
                    type="tel"
                    value={newClient.phoneNumber}
                    onChange={(e) => setNewClient((c) => ({ ...c, phoneNumber: e.target.value }))}
                    placeholder="+230 5XXX XXXX"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Booking fields */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Booking type</Label>
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

          {/* Start date + time */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start date & time *</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* End date + time */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End date & time (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
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
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending || !form.startDate}>
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            {clientMode === 'new' ? 'Create client & booking' : 'Create booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
