import { prisma } from '@/config/prisma.js';
import type {
  CreateDailyTaskInput,
  DailyTaskPeriodQuery,
  UpdateDailyTaskInput,
} from '@/validations/dailyTask.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { getDayBoundsInTimeZone } from '@/utils/timezone.js';

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function periodRange(query: DailyTaskPeriodQuery): { from: Date; to: Date } {
  if (query.view === 'year') {
    return {
      from: new Date(Date.UTC(query.year, 0, 1, 0, 0, 0)),
      to: new Date(Date.UTC(query.year + 1, 0, 1, 0, 0, 0)),
    };
  }

  const month = query.month ?? 1;
  return {
    from: new Date(Date.UTC(query.year, month - 1, 1, 0, 0, 0)),
    to: new Date(Date.UTC(query.year, month, 1, 0, 0, 0)),
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class DailyTaskService {
  private serialize(task: {
    id: string;
    title: string;
    minutes: number;
    date: Date;
    completed: boolean;
    completedAt: Date | null;
    note: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...task,
      date: toDateKey(task.date),
    };
  }

  async listByPeriod(userId: string, query: DailyTaskPeriodQuery) {
    const { from, to } = periodRange(query);
    const tasks = await prisma.dailyTask.findMany({
      where: { userId, date: { gte: from, lt: to } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    const today = todayKey();
    const daysMap = new Map<
      string,
      { date: string; total: number; overdue: number; pending: number; completed: number; minutes: number; minutesDone: number }
    >();

    for (const task of tasks) {
      const key = toDateKey(task.date);
      const bucket = daysMap.get(key) ?? {
        date: key,
        total: 0,
        overdue: 0,
        pending: 0,
        completed: 0,
        minutes: 0,
        minutesDone: 0,
      };
      bucket.total += 1;
      bucket.minutes += task.minutes;
      if (task.completed) {
        bucket.completed += 1;
        bucket.minutesDone += task.minutes;
      } else if (key < today) {
        bucket.overdue += 1;
      } else {
        bucket.pending += 1;
      }
      daysMap.set(key, bucket);
    }

    const days = [...daysMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    const totals = {
      total: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
      pending: tasks.filter((task) => !task.completed && toDateKey(task.date) >= today).length,
      overdue: tasks.filter((task) => !task.completed && toDateKey(task.date) < today).length,
      minutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
      minutesDone: tasks
        .filter((task) => task.completed)
        .reduce((sum, task) => sum + task.minutes, 0),
    };

    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      minutes: 0,
      minutesDone: 0,
    }));

    if (query.view === 'year') {
      for (const task of tasks) {
        const monthIndex = task.date.getUTCMonth();
        const bucket = byMonth[monthIndex]!;
        const key = toDateKey(task.date);
        bucket.total += 1;
        bucket.minutes += task.minutes;
        if (task.completed) {
          bucket.completed += 1;
          bucket.minutesDone += task.minutes;
        } else if (key < today) {
          bucket.overdue += 1;
        } else {
          bucket.pending += 1;
        }
      }
    }

    return {
      period: {
        view: query.view,
        year: query.year,
        month: query.view === 'month' ? (query.month ?? null) : null,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals,
      days,
      byMonth: query.view === 'year' ? byMonth : [],
      tasks: tasks.map((task) => this.serialize(task)),
    };
  }

  async listByDay(userId: string, date: string) {
    const day = parseDateOnly(date);
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + 1);

    const tasks = await prisma.dailyTask.findMany({
      where: { userId, date: { gte: day, lt: next } },
      orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      date,
      tasks: tasks.map((task) => this.serialize(task)),
      totals: {
        total: tasks.length,
        completed: tasks.filter((task) => task.completed).length,
        pending: tasks.filter((task) => !task.completed).length,
        minutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
        minutesDone: tasks
          .filter((task) => task.completed)
          .reduce((sum, task) => sum + task.minutes, 0),
      },
    };
  }

  async getForestSummary(userId: string) {
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

    const timezone = user.timezone || 'Europe/Helsinki';
    const { startUtc, endUtc } = getDayBoundsInTimeZone(timezone);

    const [totalCompleted, completedToday] = await Promise.all([
      prisma.dailyTask.count({
        where: { userId, completed: true },
      }),
      prisma.dailyTask.count({
        where: {
          userId,
          completed: true,
          completedAt: { gte: startUtc, lte: endUtc },
        },
      }),
    ]);

    return {
      totalCompleted,
      completedToday,
    };
  }

  async create(userId: string, input: CreateDailyTaskInput) {
    const task = await prisma.dailyTask.create({
      data: {
        userId,
        title: input.title,
        minutes: input.minutes,
        date: parseDateOnly(input.date),
        note: input.note ?? '',
      },
    });
    return this.serialize(task);
  }

  async update(userId: string, id: string, input: UpdateDailyTaskInput) {
    const existing = await prisma.dailyTask.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Task not found', {
        statusCode: 404,
        code: 'DAILY_TASK_NOT_FOUND',
      });
    }

    const task = await prisma.dailyTask.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.minutes !== undefined ? { minutes: input.minutes } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.completed !== undefined
          ? {
              completed: input.completed,
              completedAt: input.completed ? new Date() : null,
            }
          : {}),
      },
    });

    return this.serialize(task);
  }

  async remove(userId: string, id: string) {
    const existing = await prisma.dailyTask.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Task not found', {
        statusCode: 404,
        code: 'DAILY_TASK_NOT_FOUND',
      });
    }

    await prisma.dailyTask.delete({ where: { id } });
    return { success: true };
  }
}

export const dailyTaskService = new DailyTaskService();
