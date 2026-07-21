import { MaterialStatus, ReminderStatus } from '@prisma/client';
import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import { getDayBoundsInTimeZone } from '@/utils/timezone.js';

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

export class StatisticsService {
  async getDashboard(userId: string) {
    const timezone = await getUserTimezone(userId);
    const now = new Date();
    const { startUtc, endUtc } = getDayBoundsInTimeZone(timezone, now);

    const [
      activeMaterials,
      todayReminders,
      overdueReminders,
      completedReviews,
      nextReminder,
      recentMaterials,
      unreadNotifications,
    ] = await Promise.all([
      prisma.learningMaterial.count({
        where: { userId, status: MaterialStatus.ACTIVE },
      }),
      prisma.reviewReminder.count({
        where: {
          userId,
          scheduledAt: { gte: startUtc, lte: endUtc },
          status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] },
        },
      }),
      prisma.reviewReminder.count({
        where: {
          userId,
          scheduledAt: { lt: startUtc },
          status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] },
        },
      }),
      prisma.reviewReminder.count({
        where: {
          userId,
          status: ReminderStatus.COMPLETED,
        },
      }),
      prisma.reviewReminder.findFirst({
        where: {
          userId,
          status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] },
          scheduledAt: { gte: startUtc },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          material: {
            select: {
              id: true,
              title: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.learningMaterial.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          learnedAt: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    const nearestReminder =
      nextReminder ??
      (await prisma.reviewReminder.findFirst({
        where: {
          userId,
          status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          material: {
            select: {
              id: true,
              title: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }));

    return {
      timezone,
      stats: {
        activeMaterials,
        todayReminders,
        overdueReminders,
        completedReviews,
        unreadNotifications,
      },
      nextReminder: nearestReminder,
      recentMaterials,
    };
  }

  async getActivity(userId: string) {
    const timezone = await getUserTimezone(userId);
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const startLocal = startOfDay(subDays(zonedNow, 6));
    const endLocal = endOfDay(zonedNow);
    const startUtc = fromZonedTime(startLocal, timezone);
    const endUtc = fromZonedTime(endLocal, timezone);

    const completed = await prisma.reviewReminder.findMany({
      where: {
        userId,
        status: ReminderStatus.COMPLETED,
        completedAt: {
          gte: startUtc,
          lte: endUtc,
        },
      },
      select: {
        completedAt: true,
      },
    });

    const days = eachDayOfInterval({
      start: startLocal,
      end: endLocal,
    });

    const activity = days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const count = completed.filter((item) => {
        if (!item.completedAt) return false;
        const local = toZonedTime(item.completedAt, timezone);
        return format(local, 'yyyy-MM-dd') === key;
      }).length;

      return {
        date: key,
        count,
      };
    });

    return {
      timezone,
      activity,
    };
  }
}

export const statisticsService = new StatisticsService();
