import app from '@/app.js';
import { assertRequiredSecrets, env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { connectDatabase } from '@/config/prisma.js';
import { startNodeCronScheduler } from '@/jobs/scheduler.js';

assertRequiredSecrets();

async function bootstrap(): Promise<void> {
  if (env.DATABASE_URL) {
    await connectDatabase();
  } else {
    logger.warn('DATABASE_URL is not set; API will start without database connection');
  }

  const port = env.PORT;

  app.listen(port, '0.0.0.0', () => {
    logger.info(`API listening on port ${port}`, {
      env: env.NODE_ENV,
      clientUrl: env.CLIENT_URL,
      databaseConfigured: Boolean(env.DATABASE_URL),
      nodeCronEnabled: env.ENABLE_NODE_CRON,
    });

    startNodeCronScheduler();
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
