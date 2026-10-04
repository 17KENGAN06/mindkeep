import { env } from '@/config/env';
import i18n from '@/i18n';
import type { ApiErrorBody } from '@/types/auth';

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

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs, signal, headers: headerInit, ...rest } = options;
  const headers = new Headers(headerInit);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Used by server CSRF middleware when Origin is absent.
  headers.set('X-Requested-With', 'learning-reminder');
  headers.set('X-App-Language', i18n.resolvedLanguage ?? i18n.language ?? 'en');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs ?? 12_000);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...rest,
      headers,
      credentials: 'include',
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, {
        code: 'TIMEOUT',
        message: 'Request timed out',
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

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
  post: <T>(path: string, body?: unknown, extra?: { timeoutMs?: number }) =>
    request<T>(path, { method: 'POST', body, timeoutMs: extra?.timeoutMs }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
