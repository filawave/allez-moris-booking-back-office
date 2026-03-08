import { strapiGet, strapiPut } from './strapi';
import type { Booking, BookingFilters, BookingStatus, PaymentStatus, StrapiListResponse, StrapiSingleResponse } from '@/types';

export async function fetchBookings(filters: BookingFilters = {}): Promise<StrapiListResponse<Booking>> {
  const params = new URLSearchParams();

  params.set('populate[client]', 'true');
  params.set('populate[activity]', 'true');
  params.set('sort', 'createdAt:desc');
  params.set('pagination[page]', String(filters.page ?? 1));
  params.set('pagination[pageSize]', String(filters.pageSize ?? 25));

  if (filters.bookingStatus && filters.bookingStatus !== 'all') {
    params.set('filters[bookingStatus][$eq]', filters.bookingStatus);
  }
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    params.set('filters[paymentStatus][$eq]', filters.paymentStatus);
  }
  if (filters.bookingType && filters.bookingType !== 'all') {
    params.set('filters[bookingType][$eq]', filters.bookingType);
  }

  return strapiGet<StrapiListResponse<Booking>>(`/api/bookings?${params.toString()}`);
}

export async function fetchBookingByDocumentId(documentId: string): Promise<StrapiSingleResponse<Booking>> {
  return strapiGet<StrapiSingleResponse<Booking>>(
    `/api/bookings/${documentId}?populate[client]=true&populate[activity]=true`,
  );
}

export async function updateBooking(
  documentId: string,
  data: Partial<{
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus;
    startDate: string;
    endDate: string;
    participants: number;
    totalPrice: number;
  }>,
): Promise<StrapiSingleResponse<Booking>> {
  return strapiPut<StrapiSingleResponse<Booking>>(`/api/bookings/${documentId}`, data);
}

export async function fetchBookingStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  revenue: number;
}> {
  const [totalRes, pendingRes, confirmedRes, cancelledRes, completedRes, revenueRes] = await Promise.all([
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?pagination[pageSize]=1'),
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?filters[bookingStatus][$eq]=pending&pagination[pageSize]=1'),
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?filters[bookingStatus][$eq]=confirmed&pagination[pageSize]=1'),
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?filters[bookingStatus][$eq]=cancelled&pagination[pageSize]=1'),
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?filters[bookingStatus][$eq]=completed&pagination[pageSize]=1'),
    strapiGet<StrapiListResponse<Booking>>('/api/bookings?filters[paymentStatus][$eq]=paid&pagination[pageSize]=100&fields[0]=totalPrice'),
  ]);

  const revenue = revenueRes.data.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

  return {
    total: totalRes.meta.pagination.total,
    pending: pendingRes.meta.pagination.total,
    confirmed: confirmedRes.meta.pagination.total,
    cancelled: cancelledRes.meta.pagination.total,
    completed: completedRes.meta.pagination.total,
    revenue,
  };
}
