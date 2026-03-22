import { strapiGet, strapiPost } from './strapi';
import type { Client, StrapiListResponse, StrapiSingleResponse } from '@/types';

export async function fetchClients(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<StrapiListResponse<Client>> {
  const qs = new URLSearchParams();
  qs.set('sort', 'createdAt:desc');
  qs.set('pagination[page]', String(params.page ?? 1));
  qs.set('pagination[pageSize]', String(params.pageSize ?? 25));

  if (params.search) {
    qs.set('filters[$or][0][firstName][$containsi]', params.search);
    qs.set('filters[$or][1][lastName][$containsi]', params.search);
    qs.set('filters[$or][2][email][$containsi]', params.search);
  }

  return strapiGet<StrapiListResponse<Client>>(`/api/clients?${qs.toString()}`);
}

export async function fetchClientByDocumentId(documentId: string): Promise<StrapiSingleResponse<Client>> {
  return strapiGet<StrapiSingleResponse<Client>>(`/api/clients/${documentId}?populate[bookings]=true`);
}

export async function createClient(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}): Promise<StrapiSingleResponse<Client>> {
  return strapiPost<StrapiSingleResponse<Client>>('/api/clients', { data });
}
