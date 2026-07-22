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

    // Always 200 for Railway liveness — DB status is informational.
    // A hard DB outage should not block deploy/restart loops.
    res.status(200).json({
      status: database === 'down' ? 'degraded' : 'ok',
      service: 'learning-reminder-api',
      environment: env.NODE_ENV,
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);
