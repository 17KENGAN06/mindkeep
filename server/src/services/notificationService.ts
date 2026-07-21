import { NotificationType, Prisma, ReminderStatus } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import { getCalendarDaysOverdue } from '@/utils/timezone.js';

type ReminderForNotification = {
  id: string;
  userId: string;
  materialId: string;
  sequenceNumber: number;
  scheduledAt: Date;
  status: ReminderStatus;
  notificationCreatedAt: Date | null;
  material: {
    title: string;
  };
  user: {
    timezone: string;
  };
};

export type CreateSystemNotificationInput = {
  userId: string;
  title: string;
  message: string;
  materialId?: string | null;
};

/**
 * Central notification gateway.
 * MVP: persists in-app notifications.
 * Future: email / Telegram / push can plug in here.
 */
export class NotificationService {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        material: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new AppError('Notification not found', {
        statusCode: 404,
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        material: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  async createSystemNotification(input: CreateSystemNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: NotificationType.SYSTEM,
        materialId: input.materialId ?? null,
        isRead: false,
      },
    });
  }

  /**
   * Creates an in-app notification for a due/overdue reminder exactly once.
   * Uses notificationCreatedAt + unique reminderId as idempotency guards.
   */
  async createReminderNotification(reminderId: string) {
    const reminder = await prisma.reviewReminder.findUnique({
      where: { id: reminderId },
      include: {
        material: { select: { title: true } },
        user: { select: { timezone: true } },
      },
    });

    if (!reminder) {
      throw new AppError('Reminder not found', {
        statusCode: 404,
        code: 'REMINDER_NOT_FOUND',
      });
    }

    if (reminder.notificationCreatedAt) {
      return { created: false as const, notification: null };
    }

    if (
      reminder.status === ReminderStatus.COMPLETED ||
      reminder.status === ReminderStatus.SKIPPED
    ) {
      return { created: false as const, notification: null };
    }

    const daysOverdue = getCalendarDaysOverdue(
      reminder.scheduledAt,
      reminder.user.timezone || 'Europe/Helsinki',
    );
    const type = daysOverdue > 0 ? NotificationType.REVIEW_OVERDUE : NotificationType.REVIEW_DUE;
    const payload = this.buildReminderCopy(reminder, type, daysOverdue);

    try {
      const notification = await prisma.$transaction(async (tx) => {
        const locked = await tx.reviewReminder.findUnique({
          where: { id: reminder.id },
          select: { notificationCreatedAt: true },
        });

        if (locked?.notificationCreatedAt) {
          return null;
        }

        const created = await tx.notification.create({
          data: {
            userId: reminder.userId,
            materialId: reminder.materialId,
            reminderId: reminder.id,
            type,
            title: payload.title,
            message: payload.message,
            isRead: false,
          },
        });

        await tx.reviewReminder.update({
          where: { id: reminder.id },
          data: { notificationCreatedAt: new Date() },
        });

        return created;
      });

      if (!notification) {
        return { created: false as const, notification: null };
      }

      // Extension point for future channels:
      // await this.sendEmail(notification)
      // await this.sendTelegram(notification)
      // await this.sendPush(notification)

      return { created: true as const, notification };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { created: false as const, notification: null };
      }

      throw error;
    }
  }

  private buildReminderCopy(
    reminder: ReminderForNotification,
    type: NotificationType,
    daysOverdue: number,
  ) {
    if (type === NotificationType.REVIEW_OVERDUE) {
      return {
        title: 'Overdue review',
        message: `"${reminder.material.title}" is ${daysOverdue} day(s) overdue (review #${reminder.sequenceNumber}).`,
      };
    }

    return {
      title: 'Review due today',
      message: `Time to review "${reminder.material.title}" (review #${reminder.sequenceNumber}).`,
    };
  }
}

export const notificationService = new NotificationService();
