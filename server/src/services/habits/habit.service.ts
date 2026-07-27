import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import { getDayBoundsInTimeZone } from '@/utils/timezone.js';
import {
  formatLocalDateKey,
  parseLocalDateKey,
} from '@/services/planner/date.service.js';
import { addDays, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import type { CreateHabitInput, ToggleHabitLogInput, UpdateHabitInput } from '@/validations/habits.schemas.js';

async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user) {
    throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
  }

  return user.timezone || 'Europe/Helsinki';
}

export class HabitService {
  async list(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { startUtc } = getDayBoundsInTimeZone(timezone);

    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        logs: {
          where: { date: startUtc, completed: true },
          take: 1,
        },
      },
    });

    const stats = await this.getStatistics(userId);

    return {
      timezone,
      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        isActive: habit.isActive,
        createdAt: habit.createdAt,
        completedToday: habit.logs.length > 0,
      })),
      stats: stats.stats,
    };
  }

  async create(userId: string, input: CreateHabitInput) {
    return prisma.habit.create({
      data: { title: input.title, userId },
    });
  }

  async update(userId: string, id: string, input: UpdateHabitInput) {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }

    return prisma.habit.update({
      where: { id },
      data: {
        title: input.title,
        isActive: input.isActive,
      },
    });
  }

  async remove(userId: string, id: string) {
    const habit = await prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }
    await prisma.habit.delete({ where: { id } });
    return { success: true as const };
  }

  async toggleLog(userId: string, habitId: string, input: ToggleHabitLogInput) {
    const timezone = await getUserTimezone(userId);
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }

    const dateKey = input.date
      ? input.date.includes('T')
        ? formatLocalDateKey(new Date(input.date), timezone)
        : input.date
      : formatLocalDateKey(new Date(), timezone);
    const date = parseLocalDateKey(dateKey, timezone);
    const completed = input.completed ?? true;

    if (!completed) {
      await prisma.habitLog.deleteMany({ where: { habitId, date } });
      return { habitId, dateKey, completed: false };
    }

    await prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, userId, date, completed: true },
      update: { completed: true },
    });

    return { habitId, dateKey, completed: true };
  }

  async getStatistics(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { startUtc, endUtc } = getDayBoundsInTimeZone(timezone);

    const [activeHabits, completedToday, totalLogs] = await Promise.all([
      prisma.habit.count({ where: { userId, isActive: true } }),
      prisma.habitLog.count({
        where: { userId, completed: true, date: { gte: startUtc, lte: endUtc } },
      }),
      prisma.habitLog.count({ where: { userId, completed: true } }),
    ]);

    const streak = await this.computeStreak(userId, timezone);
    const completionRateToday =
      activeHabits === 0 ? 0 : Math.round((completedToday / activeHabits) * 1000) / 10;

    return {
      timezone,
      stats: {
        activeHabits,
        completedToday,
        totalLogs,
        completionRateToday,
        streak,
      },
    };
  }

  private async computeStreak(userId: string, timezone: string): Promise<number> {
    const activeHabits = await prisma.habit.count({ where: { userId, isActive: true } });
    if (activeHabits === 0) return 0;

    const logs = await prisma.habitLog.findMany({
      where: { userId, completed: true },
      select: { date: true, habitId: true },
      orderBy: { date: 'desc' },
      take: 2000,
    });

    const byDay = new Map<string, Set<string>>();
    for (const log of logs) {
      const key = formatLocalDateKey(log.date, timezone);
      if (!byDay.has(key)) byDay.set(key, new Set());
      byDay.get(key)!.add(log.habitId);
    }

    let streak = 0;
    let cursor = toZonedTime(new Date(), timezone);
    const todayKey = formatLocalDateKey(fromZonedTime(startOfDay(cursor), timezone), timezone);
    const todaySet = byDay.get(todayKey);
    if (!todaySet || todaySet.size === 0) {
      cursor = addDays(cursor, -1);
    }

    for (let i = 0; i < 400; i += 1) {
      const key = formatLocalDateKey(fromZonedTime(startOfDay(cursor), timezone), timezone);
      const set = byDay.get(key);
      if (!set || set.size === 0) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }
}

export const habitService = new HabitService();
