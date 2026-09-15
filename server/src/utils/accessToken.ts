import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@/config/cookies.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * Reads the access JWT from `Authorization: Bearer` (mobile) or the
 * httpOnly cookie (website). Bearer wins when the header is present.
 */
export function getAccessTokenFromRequest(req: Request): string | undefined {
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  return resolveAccessToken(header, req.cookies?.[ACCESS_TOKEN_COOKIE]);
}

export function resolveAccessToken(
  authorizationHeader: string | undefined | null,
  cookieToken: unknown,
): string | undefined {
  const header = authorizationHeader?.trim();

  if (header) {
    const match = BEARER_PATTERN.exec(header);
    return match?.[1];
  }

  return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : undefined;
}
