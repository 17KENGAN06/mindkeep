import type { NextFunction, Request, Response } from 'express';
import { allowedClientOrigins } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, '');
}

/**
 * Mitigates CSRF for cookie-authenticated cross-origin deployments
 * (SameSite=None). Allows Railway Cron without browser Origin.
 */
export function requireSameOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const path = req.originalUrl.split('?')[0] ?? req.path;
  if (path.startsWith('/api/internal/cron')) {
    next();
    return;
  }

  const origin = req.get('origin');

  if (origin) {
    const normalized = normalizeOrigin(origin);
    if (!allowedClientOrigins.includes(normalized)) {
      throw new AppError('Invalid origin', {
        statusCode: 403,
        code: 'CSRF_REJECTED',
        details: { origin: normalized },
      });
    }

    next();
    return;
  }

  // Non-browser clients must send an explicit app header.
  if (req.get('x-requested-with') !== 'learning-reminder') {
    throw new AppError('Missing CSRF header', {
      statusCode: 403,
      code: 'CSRF_REJECTED',
    });
  }

  next();
}
