import type { Request, Response } from 'express';
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

export class NotificationController {
  async list(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req);
    const [notifications, unreadCount] = await Promise.all([
      notificationService.list(userId),
      notificationService.unreadCount(userId),
    ]);

    res.status(200).json({ notifications, unreadCount });
  }

  async unreadCount(req: Request, res: Response): Promise<void> {
    const unreadCount = await notificationService.unreadCount(requireUserId(req));
    res.status(200).json({ unreadCount });
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
