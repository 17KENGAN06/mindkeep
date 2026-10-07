import { createHash } from 'node:crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function ipAuthLimit(limit: number, message: string) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'anonymous'),
    message: {
      error: {
        code: 'RATE_LIMITED',
        message,
      },
    },
  });
}

/** Credential stuffing: own IP bucket, skipped from the global guest limiter. */
export const loginRateLimit = ipAuthLimit(
  10,
  'Too many login attempts. Please try again later.',
);

/** Account creation is cheaper to abuse than login. */
export const registerRateLimit = ipAuthLimit(
  5,
  'Too many registration attempts. Please try again later.',
);

export const googleAuthRateLimit = ipAuthLimit(
  20,
  'Too many Google sign-in attempts. Please try again later.',
);

export const challengeRateLimit = ipAuthLimit(
  40,
  'Too many requests. Please try again later.',
);

export const forgotPasswordRateLimit = ipAuthLimit(
  5,
  'Too many password reset attempts. Please try again later.',
);

export const emailTokenRateLimit = ipAuthLimit(
  20,
  'Too many attempts. Please try again later.',
);

const REFRESH_LIMIT_MESSAGE = 'Too many session refresh attempts. Please try again later.';

/**
 * Bucket key for a refresh attempt: the SHA-256 of the refresh token (never the token itself),
 * or the client IP when the body has none.
 */
export function refreshRateLimitKey(body: unknown, ipKey: string): string {
  const raw =
    typeof body === 'object' && body !== null && 'refreshToken' in body
      ? (body as { refreshToken?: unknown }).refreshToken
      : undefined;
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (token) {
    return `refresh-token:${createHash('sha256').update(token).digest('hex')}`;
  }
  return `refresh-ip:${ipKey}`;
}

/**
 * Many phones share one carrier IP, so refresh is limited per session (refresh token),
 * with a looser per-IP ceiling against abuse. Tokens are 256-bit random, so guessing is not viable.
 */
export const refreshRateLimit = [
  ipAuthLimit(300, REFRESH_LIMIT_MESSAGE),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => refreshRateLimitKey(req.body, ipKeyGenerator(req.ip ?? 'anonymous')),
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: REFRESH_LIMIT_MESSAGE,
      },
    },
  }),
];

export const deleteAccountRateLimit = ipAuthLimit(
  3,
  'Too many account deletion attempts. Please try again later.',
);
