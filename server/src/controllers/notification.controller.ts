import type { Request, Response } from 'express';
import { resolveAppLocale } from '@/services/emailCopy.js';
import { notificationService } from '@/services/notificationService.js';
import { AppError } from '@/utils/AppError.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return req.user.id;
}

function localeFromRequest(req: Request) {
  const header = req.header('x-app-language') ?? req.header('accept-language');
  return resolveAppLocale(header);
}

export class NotificationController {
  async list(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const locale = localeFromRequest(req);
    const summary = await notificationService.inboxSummary(userId, locale);
    const notifications = await notificationService.list(userId);

    res.status(200).json({
      notifications,
      unreadCount: summary.unreadCount,
      dueToday: summary.dueToday,
      overdue: summary.overdue,
    });
  }

  async unreadCount(req: Request, res: Response): Promise<void> {
    const summary = await notificationService.inboxSummary(
      requireUserId(req),
      localeFromRequest(req),
    );
    res.status(200).json(summary);
  }

  async markRead(req: Request, res: Response): Promise<void> {
    const notification = await notificationService.markRead(
      requireUserId(req),
      req.params.id as string,
    );
    res.status(200).json({ notification });
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    const result = await notificationService.markAllRead(requireUserId(req));
    res.status(200).json(result);
  }
}

export const notificationController = new NotificationController();
