export type BookingType = 'car_rental' | 'activity' | 'accommodation';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paypal_processing' | 'paid' | 'refunded' | 'failed';

export interface Client {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: number;
  documentId: string;
  name?: string;
  publicPrice?: number;
  childPrice?: number;
  isGroupPrice?: boolean;
  maxPersons?: number;
}

export interface Booking {
  id: number;
  documentId: string;
  bookingType: BookingType;
  startDate: string;
  endDate?: string;
  participants: number;
  bookingStatus: BookingStatus;
  totalPrice: number;
  paymentStatus?: PaymentStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  client?: Client;
  activity?: Activity;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
}

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
}

export interface BookingFilters {
  bookingStatus?: BookingStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  bookingType?: BookingType | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}
