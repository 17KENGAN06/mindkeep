import { NotificationType, ReminderStatus } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type { AppLocale } from '@/services/emailCopy.js';
import {
  reminderNotificationCopy,
  taskImportantNotificationCopy,
} from '@/services/notificationCopy.js';
import { AppError } from '@/utils/AppError.js';
import { getCalendarDaysOverdue, getDayBoundsInTimeZone } from '@/utils/timezone.js';
import { freeVisibleIds } from '@/services/entitlements.service.js';

const notificationInclude = {
  material: {
    select: {
      id: true,
      title: true,
    },
  },
  dailyTask: {
    select: {
      id: true,
      title: true,
      date: true,
      minutes: true,
      completed: true,
      important: true,
    },
  },
} as const;

type ReminderForNotify = {
  id: string;
  userId: string;
  materialId: string;
  sequenceNumber: number;
  scheduledAt: Date;
  notificationCreatedAt: Date | null;
  material: { title: string } | null;
  user: { timezone: string };
};

export type NotificationInboxSummary = {
  unreadCount: number;
  dueToday: number;
  overdue: number;
  important: number;
};

type TaskForNotify = {
  id: string;
  userId: string;
  title: string;
  date: Date | string;
  minutes: number;
  completed: boolean;
  important: boolean;
};

function dateKeyOf(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function copyForReminder(
  reminder: ReminderForNotify,
  locale: AppLocale,
  daysOverdue: number,
) {
  return reminderNotificationCopy(locale, daysOverdue > 0 ? 'overdue' : 'due', {
    title: reminder.material?.title ?? 'Material',
    sequence: reminder.sequenceNumber,
    daysOverdue,
  });
}

export class NotificationService {
  async list(userId: string) {
    const include = notificationInclude;
    const [important, rest] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, type: NotificationType.TASK_IMPORTANT },
        include,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId, NOT: { type: NotificationType.TASK_IMPORTANT } },
        include,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return [...important, ...rest];
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async inboxSummary(userId: string, locale: AppLocale = 'en'): Promise<NotificationInboxSummary> {
    const [counts, important] = await Promise.all([
      this.syncUserReviewNotifications(userId, locale),
      this.syncUserTaskNotifications(userId, locale),
    ]);
    const unreadCount = await this.unreadCount(userId);
    return { unreadCount, important, ...counts };
  }

  /**
   * Create or refresh due/overdue review notifications for this user.
   * Runs on list/unread so the website does not wait for hourly cron.
   */
  async syncUserReviewNotifications(
    userId: string,
    locale: AppLocale = 'en',
  ): Promise<{ dueToday: number; overdue: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone || 'Europe/Helsinki';
    const { endUtc } = getDayBoundsInTimeZone(timezone);

    const visibleIds = await freeVisibleIds(userId, 'materials');
    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        ...(visibleIds ? { materialId: { in: visibleIds } } : {}),
        status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] },
        scheduledAt: { lte: endUtc },
      },
      include: {
        material: { select: { title: true } },
        user: { select: { timezone: true } },
      },
    });

    const pendingOverdueIds = reminders
      .filter((reminder) => {
        const daysOverdue = getCalendarDaysOverdue(reminder.scheduledAt, timezone);
        return daysOverdue > 0 && reminder.status === ReminderStatus.PENDING;
      })
      .map((reminder) => reminder.id);

    if (pendingOverdueIds.length > 0) {
      await prisma.reviewReminder.updateMany({
        where: { id: { in: pendingOverdueIds }, userId },
        data: { status: ReminderStatus.OVERDUE },
      });
    }

    const existing = reminders.length
      ? await prisma.notification.findMany({
          where: { reminderId: { in: reminders.map((reminder) => reminder.id) } },
        })
      : [];
    const byReminderId = new Map(
      existing.map((notification) => [notification.reminderId, notification]),
    );

    let dueToday = 0;
    let overdue = 0;
    const stampIds: string[] = [];

    for (const reminder of reminders) {
      const daysOverdue = getCalendarDaysOverdue(reminder.scheduledAt, timezone);
      if (daysOverdue > 0) overdue += 1;
      else dueToday += 1;

      const type = daysOverdue > 0 ? NotificationType.REVIEW_OVERDUE : NotificationType.REVIEW_DUE;
      const { title, message } = copyForReminder(reminder, locale, daysOverdue);
      const found = byReminderId.get(reminder.id);

      if (!found) {
        await this.upsertReminderNotification(reminder, locale, daysOverdue);
        continue;
      }

      const becameOverdue =
        found.type === NotificationType.REVIEW_DUE && type === NotificationType.REVIEW_OVERDUE;
      const needsUpdate =
        becameOverdue || found.type !== type || found.title !== title || found.message !== message;

      if (needsUpdate) {
        await prisma.notification.update({
          where: { id: found.id },
          data: {
            type,
            title,
            message,
            ...(becameOverdue ? { isRead: false } : {}),
          },
        });
      }

      if (!reminder.notificationCreatedAt) {
        stampIds.push(reminder.id);
      }
    }

    if (stampIds.length > 0) {
      await prisma.reviewReminder.updateMany({
        where: { id: { in: stampIds }, userId },
        data: { notificationCreatedAt: new Date() },
      });
    }

    return { dueToday, overdue };
  }

  async syncUserTaskNotifications(userId: string, locale: AppLocale = 'en'): Promise<number> {
    const visibleIds = await freeVisibleIds(userId, 'tasks');
    const tasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        important: true,
        completed: false,
        ...(visibleIds ? { id: { in: visibleIds } } : {}),
      },
    });

    const existing = await prisma.notification.findMany({
      where: { userId, type: NotificationType.TASK_IMPORTANT },
    });
    const wanted = new Set(tasks.map((task) => task.id));
    const staleIds = existing
      .filter((item) => !item.dailyTaskId || !wanted.has(item.dailyTaskId))
      .map((item) => item.id);

    if (staleIds.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: staleIds } } });
    }

    for (const task of tasks) {
      await this.syncTaskNotification(task, locale);
    }

    return tasks.length;
  }

  async syncTaskNotification(task: TaskForNotify, locale: AppLocale = 'en'): Promise<void> {
    if (!task.important || task.completed) {
      await prisma.notification.deleteMany({ where: { dailyTaskId: task.id } });
      return;
    }

    const date = dateKeyOf(task.date);
    const { title, message } = taskImportantNotificationCopy(locale, {
      title: task.title,
      date,
      minutes: task.minutes,
    });

    const existing = await prisma.notification.findUnique({
      where: { dailyTaskId: task.id },
    });

    if (existing) {
      const needsUpdate =
        existing.title !== title ||
        existing.message !== message ||
        existing.type !== NotificationType.TASK_IMPORTANT;
      if (needsUpdate) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: { title, message, type: NotificationType.TASK_IMPORTANT },
        });
      }
      return;
    }

    await prisma.notification.create({
      data: {
        userId: task.userId,
        dailyTaskId: task.id,
        type: NotificationType.TASK_IMPORTANT,
        title,
        message,
      },
    });
  }

  async createReminderNotification(reminderId: string, locale: AppLocale = 'en') {
    const reminder = await prisma.reviewReminder.findUnique({
      where: { id: reminderId },
      include: {
        material: { select: { title: true } },
        user: { select: { timezone: true } },
      },
    });

    if (!reminder) {
      return { created: false as const };
    }

    const timezone = reminder.user.timezone || 'Europe/Helsinki';
    const daysOverdue = getCalendarDaysOverdue(reminder.scheduledAt, timezone);
    const created = await this.upsertReminderNotification(reminder, locale, daysOverdue);
    return { created };
  }

  private async upsertReminderNotification(
    reminder: ReminderForNotify,
    locale: AppLocale,
    daysOverdue: number,
  ): Promise<boolean> {
    const type = daysOverdue > 0 ? NotificationType.REVIEW_OVERDUE : NotificationType.REVIEW_DUE;
    const { title, message } = copyForReminder(reminder, locale, daysOverdue);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.notification.findUnique({
        where: { reminderId: reminder.id },
      });

      if (existing) {
        const becameOverdue =
          existing.type === NotificationType.REVIEW_DUE && type === NotificationType.REVIEW_OVERDUE;

        await tx.notification.update({
          where: { id: existing.id },
          data: {
            type,
            title,
            message,
            ...(becameOverdue ? { isRead: false } : {}),
          },
        });
      } else {
        await tx.notification.create({
          data: {
            userId: reminder.userId,
            materialId: reminder.materialId,
            reminderId: reminder.id,
            type,
            title,
            message,
          },
        });
      }

      if (!reminder.notificationCreatedAt) {
        await tx.reviewReminder.update({
          where: { id: reminder.id },
          data: { notificationCreatedAt: new Date() },
        });
      }

      return !existing;
    });
  }

  async markRead(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Notification not found', {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: notificationInclude,
    });
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }
}

export const notificationService = new NotificationService();
