import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

const STATE_TTL_MS = 10 * 60 * 1000;

type GoogleOAuthState = {
  returnUrl: string;
  nonce: string;
  iat: number;
};

function signingKey(): string {
  return env.JWT_SECRET ?? 'dev-google-oauth-state';
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function isPrivateOrLocalHost(hostname: string): boolean {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^(10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

export function isSafeAppReturnUrl(value: string): boolean {
  if (!value || value.length > 500) return false;
  try {
    const url = new URL(value);
    if (url.protocol === 'mindkeep:') return true;
    if (url.protocol !== 'exp:' && url.protocol !== 'exps:') return false;
    const host = url.hostname.toLowerCase();
    if (isPrivateOrLocalHost(host)) return true;
    if (host.endsWith('.exp.direct') || host.endsWith('.exp.host')) return true;
    if (host === 'u.expo.dev' || host.endsWith('.expo.dev')) return true;
    return false;
  } catch {
    return false;
  }
}

export function publicApiOrigin(req: Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  if (!host) {
    return 'https://api.mindkeep.cloud';
  }
  return `${proto}://${host}`;
}

export function googleCallbackUrl(req: Request): string {
  return `${publicApiOrigin(req)}/api/auth/google/callback`;
}

function encodeState(data: GoogleOAuthState): string {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeGoogleOAuthState(state: string): GoogleOAuthState {
  const parts = state.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError('Invalid Google sign-in state', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  const [payload, signature] = parts;
  if (!safeEqual(sign(payload), signature)) {
    throw new AppError('Invalid Google sign-in state', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  let data: GoogleOAuthState;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleOAuthState;
  } catch {
    throw new AppError('Invalid Google sign-in state', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  if (!data.returnUrl || !data.nonce || !Number.isFinite(data.iat)) {
    throw new AppError('Invalid Google sign-in state', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  if (Date.now() - data.iat > STATE_TTL_MS) {
    throw new AppError('Google sign-in expired. Try again.', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  if (!isSafeAppReturnUrl(data.returnUrl)) {
    throw new AppError('Invalid Google sign-in return URL', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  return data;
}

export function buildGoogleAuthorizeUrl(req: Request, returnUrl: string): string {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not configured', {
      statusCode: 503,
      code: 'GOOGLE_AUTH_UNAVAILABLE',
    });
  }

  if (!isSafeAppReturnUrl(returnUrl)) {
    throw new AppError('Invalid Google sign-in return URL', {
      statusCode: 400,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  const nonce = randomBytes(16).toString('base64url');
  const state = encodeState({ returnUrl, nonce, iat: Date.now() });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleCallbackUrl(req),
    response_type: 'id_token',
    response_mode: 'fragment',
    scope: 'openid email profile',
    nonce,
    state,
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function googleCallbackPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MindKeep</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #07110d; color: #e8f6ee; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
  </style>
</head>
<body>
  <p>Signing in…</p>
  <script>
    (function () {
      var params = new URLSearchParams((location.hash || '').replace(/^#/, '') || (location.search || '').replace(/^\\?/, ''));
      var error = params.get('error');
      var idToken = params.get('id_token');
      var state = params.get('state');
      if (error || !idToken || !state) {
        document.querySelector('p').textContent = 'Google sign-in was cancelled.';
        return;
      }
      var finish = '/api/auth/google/finish?' + new URLSearchParams({
        credential: idToken,
        state: state
      }).toString();
      fetch(finish, { headers: { Accept: 'application/json' } })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          var redirect = result.body && result.body.redirect;
          if (result.ok && redirect) {
            location.replace(redirect);
            return;
          }
          document.querySelector('p').textContent = 'Google sign-in failed. Return to the app and try again.';
        })
        .catch(function () {
          document.querySelector('p').textContent = 'Google sign-in failed. Return to the app and try again.';
        });
    })();
  </script>
</body>
</html>`;
}

export function appRedirectWithCredential(returnUrl: string, credential: string): string {
  const url = new URL(returnUrl);
  url.searchParams.set('credential', credential);
  return url.toString();
}
