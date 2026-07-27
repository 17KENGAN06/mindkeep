import {
  Prisma,
  TaskOccurrenceStatus,
  type TaskRecurrenceType,
} from '@prisma/client';
import { addDays, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import { getCalendarDaysOverdue, getDayBoundsInTimeZone } from '@/utils/timezone.js';
import {
  formatLocalDateKey,
  getNextDueDate,
  getWeekdayIndex,
  parseLocalDateKey,
} from '@/services/planner/date.service.js';
import type {
  CreateTaskCategoryInput,
  CreateTaskInput,
  ListOccurrencesQuery,
  UpdateTaskInput,
} from '@/validations/planner.schemas.js';

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

const occurrenceInclude = {
  task: {
    include: {
      category: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TaskOccurrenceInclude;

function mapOccurrence(
  occurrence: Prisma.TaskOccurrenceGetPayload<{ include: typeof occurrenceInclude }>,
  timezone: string,
  now = new Date(),
) {
  const daysOverdue =
    occurrence.status === TaskOccurrenceStatus.COMPLETED ||
    occurrence.status === TaskOccurrenceStatus.CANCELLED
      ? 0
      : getCalendarDaysOverdue(occurrence.dueDate, timezone, now);

  return {
    ...occurrence,
    dateKey: formatLocalDateKey(occurrence.dueDate, timezone),
    weekday: getWeekdayIndex(occurrence.dueDate, timezone),
    daysOverdue,
  };
}

export class TaskService {
  async syncOverdue(userId: string, timezone?: string) {
    const tz = timezone ?? (await getUserTimezone(userId));
    const { startUtc } = getDayBoundsInTimeZone(tz);

    await prisma.taskOccurrence.updateMany({
      where: {
        userId,
        status: TaskOccurrenceStatus.PENDING,
        dueDate: { lt: startUtc },
      },
      data: { status: TaskOccurrenceStatus.OVERDUE },
    });
  }

  listCategories(userId: string) {
    return prisma.taskCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async createCategory(userId: string, input: CreateTaskCategoryInput) {
    try {
      return await prisma.taskCategory.create({
        data: { name: input.name, userId },
        include: { _count: { select: { tasks: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category with this name already exists', {
          statusCode: 409,
          code: 'TASK_CATEGORY_NAME_TAKEN',
        });
      }
      throw error;
    }
  }

  async removeCategory(userId: string, id: string) {
    const category = await prisma.taskCategory.findFirst({ where: { id, userId } });
    if (!category) {
      throw new AppError('Category not found', { statusCode: 404, code: 'TASK_CATEGORY_NOT_FOUND' });
    }
    await prisma.taskCategory.delete({ where: { id } });
    return { success: true as const };
  }

  async createTask(userId: string, input: CreateTaskInput) {
    const timezone = await getUserTimezone(userId);
    const dueDate = parseLocalDateKey(
      input.dueDate.includes('T') ? formatLocalDateKey(new Date(input.dueDate), timezone) : input.dueDate,
      timezone,
    );

    if (input.categoryId) {
      const category = await prisma.taskCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new AppError('Category not found', { statusCode: 404, code: 'TASK_CATEGORY_NOT_FOUND' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        recurrenceType: input.recurrenceType,
        intervalDays: input.recurrenceType === 'CUSTOM_DAYS' ? input.intervalDays ?? 1 : null,
        categoryId: input.categoryId ?? null,
        userId,
        occurrences: {
          create: {
            dueDate,
            status: TaskOccurrenceStatus.PENDING,
            userId,
          },
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        occurrences: { orderBy: { dueDate: 'asc' }, take: 1 },
      },
    });

    return task;
  }

  async updateTask(userId: string, id: string, input: UpdateTaskInput) {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      throw new AppError('Task not found', { statusCode: 404, code: 'TASK_NOT_FOUND' });
    }

    if (input.categoryId) {
      const category = await prisma.taskCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new AppError('Category not found', { statusCode: 404, code: 'TASK_CATEGORY_NOT_FOUND' });
      }
    }

    const recurrenceType = (input.recurrenceType ?? task.recurrenceType) as TaskRecurrenceType;
    const intervalDays =
      recurrenceType === 'CUSTOM_DAYS'
        ? (input.intervalDays ?? task.intervalDays ?? 1)
        : null;

    return prisma.task.update({
      where: { id },
      data: {
        title: input.title,
        categoryId: input.categoryId === undefined ? undefined : input.categoryId,
        recurrenceType: input.recurrenceType,
        intervalDays,
        isActive: input.isActive,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async removeTask(userId: string, id: string) {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      throw new AppError('Task not found', { statusCode: 404, code: 'TASK_NOT_FOUND' });
    }
    await prisma.task.delete({ where: { id } });
    return { success: true as const };
  }

  async listOccurrences(userId: string, query: ListOccurrencesQuery) {
    const timezone = await getUserTimezone(userId);
    await this.syncOverdue(userId, timezone);

    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const todayStart = fromZonedTime(startOfDay(zonedNow), timezone);
    const todayEnd = fromZonedTime(endOfDay(zonedNow), timezone);
    const tomorrowStart = fromZonedTime(startOfDay(addDays(zonedNow, 1)), timezone);
    const tomorrowEnd = fromZonedTime(endOfDay(addDays(zonedNow, 1)), timezone);
    const weekEnd = fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), timezone);
    const weekStart = fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), timezone);

    const focusYear = query.year ?? zonedNow.getFullYear();
    const focusMonth = query.month ?? zonedNow.getMonth() + 1;
    const focusLocal = new Date(focusYear, focusMonth - 1, 1);
    const monthStart = fromZonedTime(startOfMonth(focusLocal), timezone);
    const monthEnd = fromZonedTime(endOfMonth(focusLocal), timezone);

    const where: Prisma.TaskOccurrenceWhereInput = {
      userId,
      ...(query.categoryId ? { task: { categoryId: query.categoryId } } : {}),
    };

    switch (query.filter) {
      case 'today':
        where.dueDate = { gte: todayStart, lte: todayEnd };
        where.status = { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] };
        break;
      case 'tomorrow':
        where.dueDate = { gte: tomorrowStart, lte: tomorrowEnd };
        where.status = { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] };
        break;
      case 'week':
        where.dueDate = { gte: weekStart, lte: weekEnd };
        where.status = { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] };
        break;
      case 'month':
        where.dueDate = { gte: monthStart, lte: monthEnd };
        where.status = {
          in: [
            TaskOccurrenceStatus.PENDING,
            TaskOccurrenceStatus.OVERDUE,
            TaskOccurrenceStatus.COMPLETED,
          ],
        };
        break;
      case 'overdue':
        where.status = TaskOccurrenceStatus.OVERDUE;
        break;
      case 'completed':
        where.status = TaskOccurrenceStatus.COMPLETED;
        break;
      case 'pending':
        where.status = { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] };
        break;
      case 'all':
      default:
        break;
    }

    const occurrences = await prisma.taskOccurrence.findMany({
      where,
      include: occurrenceInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      take: 200,
    });

    return {
      timezone,
      occurrences: occurrences.map((item) => mapOccurrence(item, timezone, now)),
    };
  }

  async completeOccurrence(userId: string, id: string) {
    const timezone = await getUserTimezone(userId);
    const occurrence = await prisma.taskOccurrence.findFirst({
      where: { id, userId },
      include: { task: true },
    });

    if (!occurrence) {
      throw new AppError('Occurrence not found', { statusCode: 404, code: 'OCCURRENCE_NOT_FOUND' });
    }

    if (occurrence.status === TaskOccurrenceStatus.COMPLETED) {
      return mapOccurrence(
        await prisma.taskOccurrence.findFirstOrThrow({
          where: { id },
          include: occurrenceInclude,
        }),
        timezone,
      );
    }

    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.taskOccurrence.update({
        where: { id },
        data: {
          status: TaskOccurrenceStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: occurrenceInclude,
      });

      if (occurrence.task.isActive) {
        const nextDue = getNextDueDate(
          occurrence.dueDate,
          {
            recurrenceType: occurrence.task.recurrenceType,
            intervalDays: occurrence.task.intervalDays,
          },
          timezone,
        );

        const existingNext = await tx.taskOccurrence.findFirst({
          where: {
            taskId: occurrence.taskId,
            dueDate: nextDue,
            status: { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] },
          },
        });

        if (!existingNext) {
          await tx.taskOccurrence.create({
            data: {
              taskId: occurrence.taskId,
              userId,
              dueDate: nextDue,
              status: TaskOccurrenceStatus.PENDING,
            },
          });
        }
      }

      return updated;
    });

    return mapOccurrence(completed, timezone);
  }

  async rescheduleOccurrence(userId: string, id: string, dueDateRaw: string) {
    const timezone = await getUserTimezone(userId);
    const occurrence = await prisma.taskOccurrence.findFirst({
      where: { id, userId },
    });

    if (!occurrence) {
      throw new AppError('Occurrence not found', { statusCode: 404, code: 'OCCURRENCE_NOT_FOUND' });
    }

    const dueDate = parseLocalDateKey(
      dueDateRaw.includes('T') ? formatLocalDateKey(new Date(dueDateRaw), timezone) : dueDateRaw,
      timezone,
    );
    const { startUtc } = getDayBoundsInTimeZone(timezone);
    const status =
      dueDate < startUtc ? TaskOccurrenceStatus.OVERDUE : TaskOccurrenceStatus.PENDING;

    const updated = await prisma.taskOccurrence.update({
      where: { id },
      data: {
        dueDate,
        status,
        completedAt: null,
      },
      include: occurrenceInclude,
    });

    return mapOccurrence(updated, timezone);
  }

  async removeOccurrence(userId: string, id: string) {
    const occurrence = await prisma.taskOccurrence.findFirst({ where: { id, userId } });
    if (!occurrence) {
      throw new AppError('Occurrence not found', { statusCode: 404, code: 'OCCURRENCE_NOT_FOUND' });
    }
    await prisma.taskOccurrence.delete({ where: { id } });
    return { success: true as const };
  }

  async getStatistics(userId: string) {
    const timezone = await getUserTimezone(userId);
    await this.syncOverdue(userId, timezone);

    const { startUtc, endUtc } = getDayBoundsInTimeZone(timezone);

    const [totalTasks, completedOccurrences, overdueOccurrences, pendingOccurrences, completedToday] =
      await Promise.all([
        prisma.task.count({ where: { userId, isActive: true } }),
        prisma.taskOccurrence.count({
          where: { userId, status: TaskOccurrenceStatus.COMPLETED },
        }),
        prisma.taskOccurrence.count({
          where: { userId, status: TaskOccurrenceStatus.OVERDUE },
        }),
        prisma.taskOccurrence.count({
          where: {
            userId,
            status: { in: [TaskOccurrenceStatus.PENDING, TaskOccurrenceStatus.OVERDUE] },
          },
        }),
        prisma.taskOccurrence.count({
          where: {
            userId,
            status: TaskOccurrenceStatus.COMPLETED,
            completedAt: { gte: startUtc, lte: endUtc },
          },
        }),
      ]);

    const totalRelevant = completedOccurrences + pendingOccurrences;
    const completionRate =
      totalRelevant === 0 ? 0 : Math.round((completedOccurrences / totalRelevant) * 1000) / 10;

    const streak = await this.computeCompletionStreak(userId, timezone);

    return {
      timezone,
      stats: {
        totalTasks,
        completedOccurrences,
        overdueOccurrences,
        pendingOccurrences,
        completedToday,
        completionRate,
        streak,
      },
    };
  }

  private async computeCompletionStreak(userId: string, timezone: string): Promise<number> {
    const completed = await prisma.taskOccurrence.findMany({
      where: {
        userId,
        status: TaskOccurrenceStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
      take: 400,
    });

    const days = new Set(
      completed
        .filter((item) => item.completedAt)
        .map((item) => formatLocalDateKey(item.completedAt!, timezone)),
    );

    let streak = 0;
    let cursor = toZonedTime(new Date(), timezone);
    const todayKey = formatLocalDateKey(fromZonedTime(startOfDay(cursor), timezone), timezone);

    if (!days.has(todayKey)) {
      cursor = addDays(cursor, -1);
    }

    for (let i = 0; i < 400; i += 1) {
      const key = formatLocalDateKey(fromZonedTime(startOfDay(cursor), timezone), timezone);
      if (!days.has(key)) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }
}

export const taskService = new TaskService();
