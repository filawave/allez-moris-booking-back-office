import { STRAPI_URL } from './strapi';
import type { StrapiUser } from '@/types';

export async function loginWithStrapi(
  identifier: string,
  password: string,
): Promise<{ jwt: string; user: StrapiUser }> {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || 'Identifiants invalides');
  }

  return res.json();
}
