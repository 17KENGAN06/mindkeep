import type { Request, Response } from 'express';
import { reminderService } from '@/services/reminder.service.js';
import { AppError } from '@/utils/AppError.js';
import type { CalendarQuery, ListRemindersQuery } from '@/validations/reminder.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return req.user.id;
}

export class ReminderController {
  async list(req: Request, res: Response): Promise<void> {
    const reminders = await reminderService.list(
      requireUserId(req),
      req.query as unknown as ListRemindersQuery,
    );
    res.status(200).json({ reminders });
  }

  async today(req: Request, res: Response): Promise<void> {
    const reminders = await reminderService.today(requireUserId(req));
    res.status(200).json({ reminders });
  }

  async upcoming(req: Request, res: Response): Promise<void> {
    const reminders = await reminderService.upcoming(requireUserId(req));
    res.status(200).json({ reminders });
  }

  async overdue(req: Request, res: Response): Promise<void> {
    const reminders = await reminderService.overdue(requireUserId(req));
    res.status(200).json({ reminders });
  }

  async calendar(req: Request, res: Response): Promise<void> {
    const data = await reminderService.calendar(
      requireUserId(req),
      req.query as unknown as CalendarQuery,
    );
    res.status(200).json(data);
  }

  async complete(req: Request, res: Response): Promise<void> {
    const reminder = await reminderService.complete(requireUserId(req), req.params.id as string);
    res.status(200).json({
      reminder,
      message: 'Review marked as completed',
    });
  }

  async skip(req: Request, res: Response): Promise<void> {
    const reminder = await reminderService.skip(requireUserId(req), req.params.id as string);
    res.status(200).json({
      reminder,
      message: 'Review skipped',
    });
  }
}

export const reminderController = new ReminderController();
