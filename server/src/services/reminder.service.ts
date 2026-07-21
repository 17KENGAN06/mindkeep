import { ReminderStatus } from '@prisma/client';
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '@/config/prisma.js';
import type { CalendarQuery, ListRemindersQuery } from '@/validations/reminder.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { getCalendarDaysOverdue, getDayBoundsInTimeZone } from '@/utils/timezone.js';

const reminderInclude = {
  material: {
    select: {
      id: true,
      title: true,
      learnedAt: true,
      status: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user) {
    throw new AppError('User not found', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return user.timezone || 'Europe/Helsinki';
}

function mapReminder<
  T extends {
    scheduledAt: Date;
    status: ReminderStatus;
  },
>(reminder: T, timezone: string) {
  const daysOverdue = getCalendarDaysOverdue(reminder.scheduledAt, timezone);
  const effectiveStatus =
    daysOverdue > 0 &&
    (reminder.status === ReminderStatus.PENDING || reminder.status === ReminderStatus.OVERDUE)
      ? ReminderStatus.OVERDUE
      : reminder.status;

  return {
    ...reminder,
    status: effectiveStatus,
    daysOverdue,
  };
}

export class ReminderService {
  async list(userId: string, query: ListRemindersQuery = {}) {
    const timezone = await getUserTimezone(userId);
    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: reminderInclude,
      orderBy: { scheduledAt: 'asc' },
      take: query.limit ?? 50,
    });

    return reminders.map((reminder) => mapReminder(reminder, timezone));
  }

  async today(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { startUtc, endUtc } = getDayBoundsInTimeZone(timezone);

    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: startUtc,
          lte: endUtc,
        },
        status: {
          in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE],
        },
      },
      include: reminderInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    return reminders.map((reminder) => mapReminder(reminder, timezone));
  }

  async overdue(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { startUtc } = getDayBoundsInTimeZone(timezone);

    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        scheduledAt: {
          lt: startUtc,
        },
        status: {
          in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE],
        },
      },
      include: reminderInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    // Persist OVERDUE for past PENDING items (idempotent).
    const pendingIds = reminders
      .filter((reminder) => reminder.status === ReminderStatus.PENDING)
      .map((reminder) => reminder.id);

    if (pendingIds.length > 0) {
      await prisma.reviewReminder.updateMany({
        where: { id: { in: pendingIds }, userId },
        data: { status: ReminderStatus.OVERDUE },
      });
    }

    return reminders.map((reminder) =>
      mapReminder({ ...reminder, status: ReminderStatus.OVERDUE }, timezone),
    );
  }

  async upcoming(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { endUtc } = getDayBoundsInTimeZone(timezone);

    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        scheduledAt: {
          gt: endUtc,
        },
        status: ReminderStatus.PENDING,
      },
      include: reminderInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    return reminders.map((reminder) => mapReminder(reminder, timezone));
  }

  async calendar(userId: string, query: CalendarQuery) {
    const timezone = await getUserTimezone(userId);

    // Build month bounds in the user's timezone.
    const monthAnchorLocal = new Date(query.year, query.month - 1, 1, 12, 0, 0, 0);
    const monthStartLocal = startOfMonth(monthAnchorLocal);
    const monthEndLocal = endOfMonth(monthAnchorLocal);
    const rangeStartUtc = fromZonedTime(monthStartLocal, timezone);
    const rangeEndUtc = fromZonedTime(monthEndLocal, timezone);

    const reminders = await prisma.reviewReminder.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: rangeStartUtc,
          lte: rangeEndUtc,
        },
      },
      include: reminderInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    const mapped = reminders.map((reminder) => {
      const item = mapReminder(reminder, timezone);
      const localDate = format(toZonedTime(reminder.scheduledAt, timezone), 'yyyy-MM-dd');
      return { ...item, localDate };
    });

    const days = eachDayOfInterval({
      start: monthStartLocal,
      end: monthEndLocal,
    }).map((day) => {
      const date = format(day, 'yyyy-MM-dd');
      const dayReminders = mapped.filter((reminder) => reminder.localDate === date);

      return {
        date,
        total: dayReminders.length,
        pending: dayReminders.filter((reminder) => reminder.status === ReminderStatus.PENDING)
          .length,
        overdue: dayReminders.filter((reminder) => reminder.status === ReminderStatus.OVERDUE)
          .length,
        completed: dayReminders.filter((reminder) => reminder.status === ReminderStatus.COMPLETED)
          .length,
        skipped: dayReminders.filter((reminder) => reminder.status === ReminderStatus.SKIPPED)
          .length,
      };
    });

    return {
      timezone,
      year: query.year,
      month: query.month,
      days,
      reminders: mapped,
    };
  }

  async complete(userId: string, id: string) {
    const reminder = await prisma.reviewReminder.findFirst({
      where: { id, userId },
      include: reminderInclude,
    });

    if (!reminder) {
      throw new AppError('Reminder not found', {
        statusCode: 404,
        code: 'REMINDER_NOT_FOUND',
      });
    }

    if (
      reminder.status === ReminderStatus.COMPLETED ||
      reminder.status === ReminderStatus.SKIPPED
    ) {
      throw new AppError('Reminder is already resolved', {
        statusCode: 400,
        code: 'REMINDER_ALREADY_RESOLVED',
      });
    }

    const timezone = await getUserTimezone(userId);
    const updated = await prisma.reviewReminder.update({
      where: { id },
      data: {
        status: ReminderStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: reminderInclude,
    });

    return mapReminder(updated, timezone);
  }

  async skip(userId: string, id: string) {
    const reminder = await prisma.reviewReminder.findFirst({
      where: { id, userId },
      include: reminderInclude,
    });

    if (!reminder) {
      throw new AppError('Reminder not found', {
        statusCode: 404,
        code: 'REMINDER_NOT_FOUND',
      });
    }

    if (
      reminder.status === ReminderStatus.COMPLETED ||
      reminder.status === ReminderStatus.SKIPPED
    ) {
      throw new AppError('Reminder is already resolved', {
        statusCode: 400,
        code: 'REMINDER_ALREADY_RESOLVED',
      });
    }

    const timezone = await getUserTimezone(userId);
    const updated = await prisma.reviewReminder.update({
      where: { id },
      data: {
        status: ReminderStatus.SKIPPED,
        completedAt: new Date(),
      },
      include: reminderInclude,
    });

    return mapReminder(updated, timezone);
  }
}

export const reminderService = new ReminderService();
