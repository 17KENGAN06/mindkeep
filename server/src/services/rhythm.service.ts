import { prisma } from '@/config/prisma.js';
import type {
  CreateHabitInput,
  RhythmPeriodQuery,
  UpdateHabitInput,
  UpsertHabitCheckInput,
} from '@/validations/rhythm.schemas.js';
import { HABIT_CYCLE_DAYS, MAX_HABITS } from '@/validations/rhythm.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { todayKeyInTimeZone } from '@/utils/timezone.js';

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 12, 0, 0));
}

function periodRange(query: RhythmPeriodQuery): { from: Date; to: Date; daysInMonth: number } {
  const from = new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(query.year, query.month, 1, 0, 0, 0));
  const daysInMonth = new Date(Date.UTC(query.year, query.month, 0)).getUTCDate();
  return { from, to, daysInMonth };
}

async function userTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return user?.timezone || 'Europe/Helsinki';
}

function currentStreak(checks: Set<string>, today: string): number {
  const todayDate = parseDateOnly(today);
  const start = checks.has(today) ? todayDate : addUtcDays(todayDate, -1);
  let cursor = start;
  let count = 0;
  while (checks.has(toDateKey(cursor))) {
    count += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return count;
}

export class RhythmService {
  async listPeriod(userId: string, query: RhythmPeriodQuery) {
    const { from, to, daysInMonth } = periodRange(query);
    const today = todayKeyInTimeZone(await userTimezone(userId));
    const streakFrom = addUtcDays(parseDateOnly(today), -(HABIT_CYCLE_DAYS + 2));
    const [habits, monthDays, recentDays, lifetimeGroups] = await Promise.all([
      prisma.habit.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.habitLog.findMany({
        where: { userId, completed: true, date: { gte: from, lt: to } },
        orderBy: { date: 'asc' },
      }),
      prisma.habitLog.findMany({
        where: { userId, completed: true, date: { gte: streakFrom } },
        select: { habitId: true, date: true },
      }),
      prisma.habitLog.groupBy({
        by: ['habitId'],
        where: { userId, completed: true },
        _count: { _all: true },
      }),
    ]);

    const checksByHabit = new Map<string, string[]>();
    for (const row of monthDays) {
      const list = checksByHabit.get(row.habitId) ?? [];
      list.push(toDateKey(row.date));
      checksByHabit.set(row.habitId, list);
    }

    const recentByHabit = new Map<string, Set<string>>();
    for (const row of recentDays) {
      const set = recentByHabit.get(row.habitId) ?? new Set<string>();
      set.add(toDateKey(row.date));
      recentByHabit.set(row.habitId, set);
    }
    const lifetimeByHabit = new Map(lifetimeGroups.map((row) => [row.habitId, row._count._all]));
    const monthElapsed =
      query.year === Number(today.slice(0, 4)) && query.month === Number(today.slice(5, 7))
        ? Number(today.slice(8, 10))
        : daysInMonth;

    return {
      year: query.year,
      month: query.month,
      daysInMonth,
      today,
      cycleDays: HABIT_CYCLE_DAYS,
      habits: habits.map((habit) => {
        const checks = checksByHabit.get(habit.id) ?? [];
        const lifetime = lifetimeByHabit.get(habit.id) ?? 0;
        return {
          id: habit.id,
          title: habit.title,
          sortOrder: 0,
          createdAt: habit.createdAt.toISOString(),
          checks,
          done: checks.length,
          target: Math.max(monthElapsed, 1),
          lifetime,
          formed: lifetime >= HABIT_CYCLE_DAYS,
          streak: currentStreak(recentByHabit.get(habit.id) ?? new Set(), today),
        };
      }),
    };
  }

  async createHabit(userId: string, input: CreateHabitInput) {
    const count = await prisma.habit.count({ where: { userId, isActive: true } });
    if (count >= MAX_HABITS) {
      throw new AppError(`You can track up to ${MAX_HABITS} habits.`, {
        statusCode: 400,
        code: 'HABIT_LIMIT',
      });
    }

    return prisma.habit.create({
      data: {
        title: input.title,
        userId,
      },
    });
  }

  async updateHabit(userId: string, id: string, input: UpdateHabitInput) {
    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }
    return prisma.habit.update({
      where: { id },
      data: { title: input.title },
    });
  }

  async removeHabit(userId: string, id: string) {
    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }
    await prisma.habit.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async upsertCheck(userId: string, input: UpsertHabitCheckInput) {
    const habit = await prisma.habit.findFirst({ where: { id: input.habitId, userId } });
    if (!habit) {
      throw new AppError('Habit not found', { statusCode: 404, code: 'HABIT_NOT_FOUND' });
    }

    const date = parseDateOnly(input.date);
    const today = todayKeyInTimeZone(await userTimezone(userId));
    if (toDateKey(date) > today) {
      throw new AppError('Future days cannot be marked.', {
        statusCode: 400,
        code: 'FUTURE_HABIT_DAY',
      });
    }

    if (input.done) {
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: input.habitId, date } },
        create: { habitId: input.habitId, userId, date, completed: true },
        update: { completed: true },
      });
    } else {
      await prisma.habitLog.deleteMany({
        where: { habitId: input.habitId, userId, date },
      });
    }

    return { habitId: input.habitId, date: toDateKey(date), done: input.done };
  }
}

export const rhythmService = new RhythmService();
