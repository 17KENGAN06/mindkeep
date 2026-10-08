import { createPublicKey, type JsonWebKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { AppError } from '@/utils/AppError.js';

const APPLE_ISSUER = 'https://appleid.apple.com';
const KEYS_URL = 'https://appleid.apple.com/auth/keys';
const TOKEN_URL = 'https://appleid.apple.com/auth/token';
const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const KEYS_TTL_MS = 60 * 60 * 1000;

type AppleJwk = JsonWebKey & { kid: string; alg?: string };
type Fetch = typeof fetch;

let cachedKeys: { keys: AppleJwk[]; at: number } | null = null;

export type AppleIdentity = {
  sub: string;
  /** Present on first sign-in (and later for non-relay accounts); may be a private relay address. */
  email?: string;
};

function invalidAppleCredential(): AppError {
  return new AppError('Invalid Apple credential', { statusCode: 401, code: 'INVALID_APPLE_CREDENTIAL' });
}

/** The app's bundle id is the token audience (native Sign in with Apple). */
export function appleAudience(): string {
  return env.APPLE_BUNDLE_ID;
}

async function appleKeys(fetchImpl: Fetch, force = false): Promise<AppleJwk[]> {
  if (!force && cachedKeys && Date.now() - cachedKeys.at < KEYS_TTL_MS) return cachedKeys.keys;
  const response = await fetchImpl(KEYS_URL);
  if (!response.ok) throw new Error(`Apple keys ${response.status}`);
  const body = (await response.json()) as { keys?: AppleJwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  cachedKeys = { keys, at: Date.now() };
  return keys;
}

/** Test hook: forget cached Apple keys. */
export function resetAppleKeysCache(): void {
  cachedKeys = null;
}

/**
 * Verifies an identity token from Sign in with Apple: RS256 signature against Apple's published
 * keys, issuer, audience (our bundle id) and expiry.
 */
export async function verifyAppleIdentityToken(
  identityToken: string,
  fetchImpl: Fetch = fetch,
): Promise<AppleIdentity> {
  const decoded = jwt.decode(identityToken, { complete: true });
  const kid = decoded && typeof decoded === 'object' ? decoded.header.kid : undefined;
  if (!kid) throw invalidAppleCredential();

  let keys: AppleJwk[];
  try {
    keys = await appleKeys(fetchImpl);
    if (!keys.some((key) => key.kid === kid)) keys = await appleKeys(fetchImpl, true);
  } catch {
    throw new AppError('Apple sign-in is unavailable. Try again.', {
      statusCode: 503,
      code: 'APPLE_AUTH_UNAVAILABLE',
    });
  }
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) throw invalidAppleCredential();

  let payload: jwt.JwtPayload;
  try {
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
    payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: APPLE_ISSUER,
      audience: appleAudience(),
    }) as jwt.JwtPayload;
  } catch {
    throw invalidAppleCredential();
  }

  if (typeof payload.sub !== 'string' || !payload.sub) throw invalidAppleCredential();
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined;
  return { sub: payload.sub, ...(email ? { email } : {}) };
}

/** Whether the server can talk to Apple's token endpoints (needed to revoke on deletion). */
export function appleClientConfigured(): boolean {
  return Boolean(env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

/** Short-lived ES256 client secret signed with the Sign in with Apple key (.p8). */
export function appleClientSecret(now = Date.now()): string {
  if (!appleClientConfigured()) {
    throw new Error('Apple client is not configured');
  }
  const issuedAt = Math.floor(now / 1000);
  return jwt.sign(
    { iss: env.APPLE_TEAM_ID, iat: issuedAt, exp: issuedAt + 300, aud: APPLE_ISSUER, sub: appleAudience() },
    (env.APPLE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    { algorithm: 'ES256', keyid: env.APPLE_KEY_ID },
  );
}

/**
 * Exchanges the one-time authorization code for a refresh token (kept only to revoke access
 * when the account is deleted). Returns null when not configured or Apple refuses.
 */
export async function exchangeAppleAuthorizationCode(code: string, fetchImpl: Fetch = fetch): Promise<string | null> {
  if (!appleClientConfigured()) return null;
  try {
    const response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appleAudience(),
        client_secret: appleClientSecret(),
        code,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!response.ok) {
      logger.warn('Apple code exchange failed', { status: response.status });
      return null;
    }
    const body = (await response.json()) as { refresh_token?: string };
    return typeof body.refresh_token === 'string' ? body.refresh_token : null;
  } catch {
    logger.warn('Apple code exchange failed');
    return null;
  }
}

/** Revokes the user's Sign in with Apple grant (required by Apple when the account is deleted). */
export async function revokeAppleRefreshToken(refreshToken: string, fetchImpl: Fetch = fetch): Promise<boolean> {
  if (!appleClientConfigured()) {
    logger.warn('Apple token not revoked: Apple client is not configured');
    return false;
  }
  try {
    const response = await fetchImpl(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appleAudience(),
        client_secret: appleClientSecret(),
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }).toString(),
    });
    if (!response.ok) logger.warn('Apple token revoke failed', { status: response.status });
    return response.ok;
  } catch {
    logger.warn('Apple token revoke failed');
    return false;
  }
}
