import { env } from '../config/env';
import {
  clearStoredToken,
  getStoredRefreshToken,
  getStoredToken,
  setStoredToken,
} from '../features/auth/session';
import type { ApiErrorBody } from '../types/auth';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody['error']) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const SKIP_REFRESH = new Set([
  '/api/auth/login',
  '/api/auth/login/code',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/challenge',
  '/api/auth/forgot-password',
]);

let refreshInFlight: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        return false;
      }

      try {
        const response = await fetch(`${env.apiUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'learning-reminder',
            'X-Mindkeep-Client': 'native',
          },
          body: JSON.stringify({ refreshToken }),
        });
        const data = (await response.json().catch(() => null)) as
          | { token?: string; refreshToken?: string }
          | null;

        if (!response.ok || !data?.token || !data.refreshToken) {
          await clearStoredToken();
          return false;
        }

        await setStoredToken(data.token, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Requested-With', 'learning-reminder');
  headers.set('X-Mindkeep-Client', 'native');

  const token = await getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (
    response.status === 401 &&
    !retried &&
    !SKIP_REFRESH.has(path) &&
    (await refreshAccessToken())
  ) {
    return request<T>(path, options, true);
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorBody | null;
    throw new ApiError(response.status, {
      code: errorBody?.error.code ?? 'REQUEST_FAILED',
      message: errorBody?.error.message ?? 'Request failed',
      details: errorBody?.error.details,
    });
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
