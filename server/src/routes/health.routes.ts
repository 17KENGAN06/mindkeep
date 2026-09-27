import { Router } from 'express';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireCronSecret } from '@/middleware/cronAuth.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get(
  '/details',
  (req, res, next) => {
    if (env.NODE_ENV !== 'production') {
      next();
      return;
    }
    requireCronSecret(req, res, next);
  },
  asyncHandler(async (_req, res) => {
    let database: 'up' | 'down' | 'not_configured' = 'not_configured';

    if (env.DATABASE_URL) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        database = 'up';
      } catch {
        database = 'down';
      }
    }

    res.status(200).json({
      status: database === 'down' ? 'degraded' : 'ok',
      service: 'learning-reminder-api',
      environment: env.NODE_ENV,
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);
