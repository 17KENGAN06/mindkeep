import cron from 'node-cron';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { runPlannerOverdueJob } from '@/jobs/plannerJob.js';
import { runReminderJob } from '@/jobs/reminderJob.js';

let started = false;

/**
 * Optional in-process scheduler for local/dev.
 * Production on Railway should prefer an external Cron hitting /api/internal/cron/*.
 */
export function startNodeCronScheduler(): void {
  if (!env.ENABLE_NODE_CRON) {
    return;
  }

  if (started) {
    return;
  }

  // Every hour at minute 0
  cron.schedule('0 * * * *', () => {
    void runReminderJob().catch((error: unknown) => {
      logger.error('Scheduled reminder job failed', error);
    });
    void runPlannerOverdueJob().catch((error: unknown) => {
      logger.error('Scheduled planner overdue job failed', error);
    });
  });

  started = true;
  logger.info('node-cron scheduler started', { expression: '0 * * * *' });
}
