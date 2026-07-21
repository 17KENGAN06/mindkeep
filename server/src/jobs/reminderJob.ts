import { ReminderStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import { prisma } from '@/config/prisma.js';
import { logger } from '@/config/logger.js';
import { notificationService } from '@/services/notificationService.js';
import { getCalendarDaysOverdue, getDayBoundsInTimeZone } from '@/utils/timezone.js';

export type ReminderJobResult = {
  scanned: number;
  overdueMarked: number;
  notificationsCreated: number;
  skippedAlreadyNotified: number;
  skippedNotDueYet: number;
};

/**
 * Hourly job:
 * 1) find open reminders whose local day has arrived
 * 2) mark overdue when the local day has passed
 * 3) create in-app notifications once per reminder
 */
export async function runReminderJob(now: Date = new Date()): Promise<ReminderJobResult> {
  const result: ReminderJobResult = {
    scanned: 0,
    overdueMarked: 0,
    notificationsCreated: 0,
    skippedAlreadyNotified: 0,
    skippedNotDueYet: 0,
  };

  const candidates = await prisma.reviewReminder.findMany({
    where: {
      status: {
        in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE],
      },
      // Wide UTC window so every user timezone's "today" is included.
      scheduledAt: {
        lte: addDays(now, 1),
      },
    },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      notificationCreatedAt: true,
      user: {
        select: {
          timezone: true,
        },
      },
    },
    take: 1000,
    orderBy: { scheduledAt: 'asc' },
  });

  result.scanned = candidates.length;

  for (const reminder of candidates) {
    const timezone = reminder.user.timezone || 'Europe/Helsinki';
    const { endUtc } = getDayBoundsInTimeZone(timezone, now);

    // Not due yet in the user's local calendar.
    if (reminder.scheduledAt.getTime() > endUtc.getTime()) {
      result.skippedNotDueYet += 1;
      continue;
    }

    const daysOverdue = getCalendarDaysOverdue(reminder.scheduledAt, timezone, now);

    if (daysOverdue > 0 && reminder.status === ReminderStatus.PENDING) {
      await prisma.reviewReminder.update({
        where: { id: reminder.id },
        data: { status: ReminderStatus.OVERDUE },
      });
      result.overdueMarked += 1;
    }

    if (reminder.notificationCreatedAt) {
      result.skippedAlreadyNotified += 1;
      continue;
    }

    const created = await notificationService.createReminderNotification(reminder.id);
    if (created.created) {
      result.notificationsCreated += 1;
    } else {
      result.skippedAlreadyNotified += 1;
    }
  }

  logger.info('Reminder job finished', result);
  return result;
}
