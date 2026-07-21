import { Router } from 'express';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
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

    const isHealthy = database !== 'down';

    if (env.NODE_ENV === 'production') {
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'learning-reminder-api',
      environment: env.NODE_ENV,
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);
