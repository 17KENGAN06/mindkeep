import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, getAuthCookieOptions } from '@/config/cookies.js';
import { isAllowedBrowserOrigin } from '@/config/env.js';
import type { PublicUser } from '@/services/auth.service.js';
import type { AuthSessionIssue } from '@/services/session.service.js';

/**
 * Website logins send an allowed Origin and keep the JWT in an httpOnly cookie.
 * Native / non-browser clients have no such Origin and need the token in JSON.
 */
export function shouldReturnAccessToken(req: Request): boolean {
  const origin = req.get('origin')?.replace(/\/$/, '');
  if (origin && isAllowedBrowserOrigin(origin)) {
    return false;
  }
  return true;
}

export function authSessionIssueFrom(req: Request): AuthSessionIssue {
  return {
    kind: shouldReturnAccessToken(req) ? 'native' : 'browser',
  };
}

export function sendAuthSession(
  req: Request,
  res: Response,
  status: number,
  user: PublicUser,
  token: string,
  refreshToken?: string,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
  res.setHeader('Cache-Control', 'no-store');

  if (shouldReturnAccessToken(req)) {
    res.status(status).json({
      user,
      token,
      ...(refreshToken ? { refreshToken } : {}),
    });
    return;
  }

  res.status(status).json({ user });
}
