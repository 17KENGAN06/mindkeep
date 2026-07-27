import type { Request, Response } from 'express';
import { runPlannerOverdueJob } from '@/jobs/plannerJob.js';
import { runReminderJob } from '@/jobs/reminderJob.js';

export class CronController {
  async runReminders(_req: Request, res: Response): Promise<void> {
    const result = await runReminderJob();
    res.status(200).json({
      ok: true,
      job: 'reminders',
      result,
      timestamp: new Date().toISOString(),
    });
  }

  async runPlannerOverdue(_req: Request, res: Response): Promise<void> {
    const result = await runPlannerOverdueJob();
    res.status(200).json({
      ok: true,
      job: 'planner-overdue',
      result,
      timestamp: new Date().toISOString(),
    });
  }
}

export const cronController = new CronController();
