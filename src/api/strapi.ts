const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'https://phenomenal-growth-682e298e29.strapiapp.com';
const API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN as string | undefined;

export { STRAPI_URL };

/**
 * Headers for content API calls (/api/...).
 * Uses a static API Token from env (required — create one in Strapi Settings > API Tokens).
 * Falls back to the admin JWT if no API token is configured (less reliable).
 */
export function getAuthHeaders(): Record<string, string> {
  const token = API_TOKEN || localStorage.getItem('strapi_jwt');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function strapiPut<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function strapiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}
