import { env } from '../config/env';
import i18n from '../i18n';
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

/**
 * The server could not be reached (offline, timeout, or refresh temporarily unavailable).
 * Extends TypeError like fetch's own network failure, so existing error mappers show the network message.
 */
export class NetworkError extends TypeError {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/** Outcome of a refresh: only `invalid` ends the session; `unavailable` keeps the stored tokens. */
export type RefreshResult = 'refreshed' | 'invalid' | 'unavailable';

const REQUEST_TIMEOUT_MS = 15_000;

const SKIP_REFRESH = new Set([
  '/api/auth/login',
  '/api/auth/login/code',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/challenge',
  '/api/auth/forgot-password',
]);

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const outer = init.signal;
  const onOuterAbort = () => controller.abort();
  outer?.addEventListener('abort', onOuterAbort);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}

let refreshInFlight: Promise<RefreshResult> | null = null;

/** One refresh at a time; concurrent callers share the same result. */
export async function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<RefreshResult> => {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        return 'invalid';
      }

      let response: Response;
      try {
        response = await fetchWithTimeout(`${env.apiUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'learning-reminder',
            'X-Mindkeep-Client': 'native',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        return 'unavailable';
      }

      // 401: revoked, expired or unknown session. 400: the stored token is malformed.
      if (response.status === 401 || response.status === 400) {
        await clearStoredToken();
        return 'invalid';
      }

      // 429 / 5xx / proxy pages: the session may still be fine — keep it and try later.
      if (!response.ok) {
        return 'unavailable';
      }

      const data = (await response.json().catch(() => null)) as
        | { token?: string; refreshToken?: string }
        | null;
      if (!data?.token || !data.refreshToken) {
        return 'unavailable';
      }

      await setStoredToken(data.token, data.refreshToken);
      return 'refreshed';
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

function sessionExpired(): ApiError {
  return new ApiError(401, { code: 'UNAUTHORIZED', message: 'Authentication required' });
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Requested-With', 'learning-reminder');
  headers.set('X-Mindkeep-Client', 'native');
  headers.set('X-App-Language', i18n.language || 'en');

  const token = await getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetchWithTimeout(`${env.apiUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);
  const errorBody = data as ApiErrorBody | null;
  const errorCode = errorBody?.error?.code;

  // Only a session failure triggers a refresh — not e.g. INVALID_PASSWORD on change-password.
  if (
    response.status === 401 &&
    !retried &&
    !SKIP_REFRESH.has(path) &&
    (!errorCode || errorCode === 'UNAUTHORIZED')
  ) {
    // Another request already refreshed while this one was in flight: just retry with the new token.
    const current = await getStoredToken();
    if (current && current !== token) {
      return request<T>(path, options, true);
    }

    const result = await refreshAccessToken();
    if (result === 'refreshed') {
      return request<T>(path, options, true);
    }
    if (result === 'unavailable') {
      throw new NetworkError('Session refresh unavailable');
    }
    throw sessionExpired();
  }

  if (!response.ok) {
    throw new ApiError(response.status, {
      code: errorCode ?? 'REQUEST_FAILED',
      message: errorBody?.error?.message ?? 'Request failed',
      details: errorBody?.error?.details,
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
