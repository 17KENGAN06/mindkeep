import type { CookieOptions } from 'express';
import { env } from '@/config/env.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Production cookies use SameSite=None + Secure so auth works when
 * the Railway frontend and API are on different origins.
 */
export function getAuthCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/** Same flags as set, without maxAge — required for browsers to drop the cookie. */
export function getAuthCookieClearOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions();
  return options;
}
