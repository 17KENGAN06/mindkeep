import { verifyAccessToken } from '@/utils/jwt.js';

/**
 * Global limiter bucket for a signed-in request, keyed by the session id (jti) of an access
 * token whose signature and expiry check out. No database lookup, so a revoked but unexpired
 * token still gets its own bucket; requireAuth rejects it later anyway.
 * Missing, forged or expired tokens return undefined and fall back to the per-IP guest bucket.
 */
export function sessionRateLimitKey(token: string | undefined): string | undefined {
  if (!token) return undefined;
  try {
    return `session:${verifyAccessToken(token).jti}`;
  } catch {
    return undefined;
  }
}
