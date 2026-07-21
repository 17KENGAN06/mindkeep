import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function requireCronSecret(req: Request, _res: Response, next: NextFunction): void {
  const headerSecret = req.header('x-cron-secret');
  const authHeader = req.header('authorization');
  const bearerSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : undefined;

  const provided = headerSecret || bearerSecret;

  if (!env.CRON_SECRET) {
    throw new AppError('CRON_SECRET is not configured', {
      statusCode: 503,
      code: 'CRON_NOT_CONFIGURED',
    });
  }

  if (!provided || !safeEqual(provided, env.CRON_SECRET)) {
    throw new AppError('Invalid cron secret', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  next();
}
