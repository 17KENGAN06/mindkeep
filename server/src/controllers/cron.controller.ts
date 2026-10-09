import type { Request, Response } from 'express';
import { runReminderJob } from '@/jobs/reminderJob.js';
import { pruneAdminAudit } from '@/services/audit.service.js';

export class CronController {
  async runReminders(_req: Request, res: Response): Promise<void> {
    const result = await runReminderJob();
    // Housekeeping on the same hourly tick: drop audit events past the retention window.
    const auditPruned = await pruneAdminAudit();
    res.status(200).json({
      ok: true,
      job: 'reminders',
      result,
      auditPruned,
      timestamp: new Date().toISOString(),
    });
  }
}

export const cronController = new CronController();
