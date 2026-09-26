import { BudgetOperationType, ReminderStatus } from '@prisma/client';
import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import type { ModerateReviewInput } from '@/validations/admin.schemas.js';

type ActivityModuleId = 'review' | 'tasks' | 'habits' | 'nutrition' | 'finance' | 'notes';

type ActivityEvent = {
  at: string;
  module: ActivityModuleId;
  action: 'created' | 'completed' | 'logged' | 'checked';
};

function latestIso(...values: Array<Date | string | null | undefined>): string | null {
  const times = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}

function earliestIso(...values: Array<Date | string | null | undefined>): string | null {
  const times = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
}

function dayKey(value: Date, timezone: string): string {
  return format(toZonedTime(value, timezone), 'yyyy-MM-dd');
}

function byUser<T extends { userId: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.userId, row]));
}

export class AdminService {
  async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            materials: true,
            reminders: true,
            dailyTasks: true,
            habits: true,
            habitLogs: true,
            meals: true,
            waterDays: true,
            weightDays: true,
            budgetOperations: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = users.map((user) => user.id);
    const empty = userIds.length === 0;
    const where = { userId: { in: userIds } };

    const [tasks, habits, meals, water, weight, finance, notes, materials, reminders, habitLogs] =
      empty
        ? [[], [], [], [], [], [], [], [], [], []]
        : await Promise.all([
            prisma.dailyTask.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.habit.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.meal.groupBy({ by: ['userId'], where, _max: { createdAt: true } }),
            prisma.waterDay.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.weightDay.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.budgetOperation.groupBy({ by: ['userId'], where, _max: { createdAt: true } }),
            prisma.note.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.learningMaterial.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.reviewReminder.groupBy({ by: ['userId'], where, _max: { updatedAt: true } }),
            prisma.habitLog.groupBy({ by: ['userId'], where, _max: { createdAt: true } }),
          ]);

    const taskMap = byUser(tasks);
    const habitMap = byUser(habits);
    const mealMap = byUser(meals);
    const waterMap = byUser(water);
    const weightMap = byUser(weight);
    const financeMap = byUser(finance);
    const noteMap = byUser(notes);
    const materialMap = byUser(materials);
    const reminderMap = byUser(reminders);
    const habitLogMap = byUser(habitLogs);

    return users.map((user) => {
      const counts = user._count;
      const modules: ActivityModuleId[] = [];
      if (counts.materials > 0 || counts.reminders > 0) modules.push('review');
      if (counts.dailyTasks > 0) modules.push('tasks');
      if (counts.habits > 0 || counts.habitLogs > 0) modules.push('habits');
      if (counts.meals > 0 || counts.waterDays > 0 || counts.weightDays > 0) modules.push('nutrition');
      if (counts.budgetOperations > 0) modules.push('finance');
      if (counts.notes > 0) modules.push('notes');

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        materialsCount: counts.materials,
        remindersCount: counts.reminders,
        lastActivityAt: latestIso(
          taskMap.get(user.id)?._max.updatedAt,
          habitMap.get(user.id)?._max.updatedAt,
          habitLogMap.get(user.id)?._max.createdAt,
          mealMap.get(user.id)?._max.createdAt,
          waterMap.get(user.id)?._max.updatedAt,
          weightMap.get(user.id)?._max.updatedAt,
          financeMap.get(user.id)?._max.createdAt,
          noteMap.get(user.id)?._max.updatedAt,
          materialMap.get(user.id)?._max.updatedAt,
          reminderMap.get(user.id)?._max.updatedAt,
        ),
        modules,
      };
    });
  }

  async getUserActivity(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        timezone: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', { statusCode: 404, code: 'ADMIN_USER_NOT_FOUND' });
    }

    const timezone = user.timezone || 'Europe/Helsinki';
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const startLocal30 = startOfDay(subDays(zonedNow, 29));
    const endLocal = endOfDay(zonedNow);
    const startUtc30 = fromZonedTime(startLocal30, timezone);
    const endUtc = fromZonedTime(endLocal, timezone);
    const recentWindow = { gte: startUtc30, lte: endUtc };
    const where = { userId: id };

    const [
      materialCount,
      reminderCount,
      reminderDone,
      reminderOpen,
      taskCount,
      taskDone,
      taskDone30,
      habitCount,
      habitActive,
      habitLogCount,
      habitLog30,
      mealCount,
      waterCount,
      weightCount,
      financeCount,
      financeIncome,
      financeExpense,
      noteCount,
      firstMaterial,
      lastMaterial,
      firstReminder,
      lastReminder,
      firstTask,
      lastTask,
      firstHabit,
      lastHabit,
      firstHabitLog,
      lastHabitLog,
      firstMeal,
      lastMeal,
      firstWater,
      lastWater,
      firstWeight,
      lastWeight,
      firstFinance,
      lastFinance,
      firstNote,
      lastNote,
      recentMaterials,
      recentReminders,
      recentTasks,
      recentHabits,
      recentMeals,
      recentWater,
      recentWeight,
      recentFinance,
      recentNotes,
      timelineMaterials,
      timelineReminders,
      timelineTasks,
      timelineHabits,
      timelineMeals,
      timelineWater,
      timelineWeight,
      timelineFinance,
      timelineNotes,
    ] = await Promise.all([
      prisma.learningMaterial.count({ where }),
      prisma.reviewReminder.count({ where }),
      prisma.reviewReminder.count({ where: { ...where, status: ReminderStatus.COMPLETED } }),
      prisma.reviewReminder.count({
        where: { ...where, status: { in: [ReminderStatus.PENDING, ReminderStatus.OVERDUE] } },
      }),
      prisma.dailyTask.count({ where }),
      prisma.dailyTask.count({ where: { ...where, completed: true } }),
      prisma.dailyTask.count({ where: { ...where, completed: true, completedAt: recentWindow } }),
      prisma.habit.count({ where }),
      prisma.habit.count({ where: { ...where, isActive: true } }),
      prisma.habitLog.count({ where }),
      prisma.habitLog.count({ where: { ...where, date: recentWindow } }),
      prisma.meal.count({ where }),
      prisma.waterDay.count({ where }),
      prisma.weightDay.count({ where }),
      prisma.budgetOperation.count({ where }),
      prisma.budgetOperation.count({ where: { ...where, type: BudgetOperationType.INCOME } }),
      prisma.budgetOperation.count({ where: { ...where, type: BudgetOperationType.EXPENSE } }),
      prisma.note.count({ where }),
      prisma.learningMaterial.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.learningMaterial.findFirst({ where, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.reviewReminder.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.reviewReminder.findFirst({
        where,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true, completedAt: true },
      }),
      prisma.dailyTask.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.dailyTask.findFirst({
        where,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true, completedAt: true },
      }),
      prisma.habit.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.habit.findFirst({ where, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.habitLog.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.habitLog.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.meal.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.meal.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.waterDay.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.waterDay.findFirst({ where, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.weightDay.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.weightDay.findFirst({ where, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.budgetOperation.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.budgetOperation.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.note.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.note.findFirst({ where, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.learningMaterial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { createdAt: true },
      }),
      prisma.reviewReminder.findMany({
        where: { userId: id, status: ReminderStatus.COMPLETED, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 6,
        select: { completedAt: true },
      }),
      prisma.dailyTask.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { completed: true, completedAt: true, createdAt: true, updatedAt: true },
      }),
      prisma.habitLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { createdAt: true },
      }),
      prisma.meal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { createdAt: true },
      }),
      prisma.waterDay.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { updatedAt: true },
      }),
      prisma.weightDay.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { updatedAt: true },
      }),
      prisma.budgetOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { createdAt: true, updatedAt: true },
      }),
      prisma.learningMaterial.findMany({
        where: { ...where, createdAt: recentWindow },
        select: { createdAt: true },
      }),
      prisma.reviewReminder.findMany({
        where: { ...where, status: ReminderStatus.COMPLETED, completedAt: recentWindow },
        select: { completedAt: true },
      }),
      prisma.dailyTask.findMany({
        where: { ...where, OR: [{ completedAt: recentWindow }, { createdAt: recentWindow }] },
        select: { completedAt: true, createdAt: true },
      }),
      prisma.habitLog.findMany({
        where: { ...where, date: recentWindow },
        select: { date: true },
      }),
      prisma.meal.findMany({
        where: { ...where, date: recentWindow },
        select: { date: true },
      }),
      prisma.waterDay.findMany({
        where: { ...where, date: recentWindow },
        select: { date: true },
      }),
      prisma.weightDay.findMany({
        where: { ...where, date: recentWindow },
        select: { date: true },
      }),
      prisma.budgetOperation.findMany({
        where: { ...where, createdAt: recentWindow },
        select: { createdAt: true },
      }),
      prisma.note.findMany({
        where: { ...where, createdAt: recentWindow },
        select: { createdAt: true },
      }),
    ]);

    const modules = [
      {
        id: 'review' as const,
        used: materialCount + reminderCount > 0,
        count: materialCount,
        extra: {
          materials: materialCount,
          reminders: reminderCount,
          completed: reminderDone,
          pending: reminderOpen,
        },
        firstAt: earliestIso(firstMaterial?.createdAt, firstReminder?.createdAt),
        lastAt: latestIso(lastMaterial?.updatedAt, lastReminder?.updatedAt, lastReminder?.completedAt),
      },
      {
        id: 'tasks' as const,
        used: taskCount > 0,
        count: taskCount,
        extra: { completed: taskDone, last30: taskDone30 },
        firstAt: earliestIso(firstTask?.createdAt),
        lastAt: latestIso(lastTask?.updatedAt, lastTask?.completedAt),
      },
      {
        id: 'habits' as const,
        used: habitCount + habitLogCount > 0,
        count: habitCount,
        extra: { active: habitActive, checks: habitLogCount, last30: habitLog30 },
        firstAt: earliestIso(firstHabit?.createdAt, firstHabitLog?.createdAt),
        lastAt: latestIso(lastHabit?.updatedAt, lastHabitLog?.createdAt),
      },
      {
        id: 'nutrition' as const,
        used: mealCount + waterCount + weightCount > 0,
        count: mealCount + waterCount + weightCount,
        extra: { meals: mealCount, waterDays: waterCount, weightDays: weightCount },
        firstAt: earliestIso(firstMeal?.createdAt, firstWater?.createdAt, firstWeight?.createdAt),
        lastAt: latestIso(lastMeal?.createdAt, lastWater?.updatedAt, lastWeight?.updatedAt),
      },
      {
        id: 'finance' as const,
        used: financeCount > 0,
        count: financeCount,
        extra: { income: financeIncome, expense: financeExpense },
        firstAt: earliestIso(firstFinance?.createdAt),
        lastAt: latestIso(lastFinance?.createdAt),
      },
      {
        id: 'notes' as const,
        used: noteCount > 0,
        count: noteCount,
        extra: {},
        firstAt: earliestIso(firstNote?.createdAt),
        lastAt: latestIso(lastNote?.updatedAt),
      },
    ];

    const eventDates: Date[] = [
      ...timelineMaterials.map((row) => row.createdAt),
      ...timelineReminders.flatMap((row) => (row.completedAt ? [row.completedAt] : [])),
      ...timelineTasks.map((row) => row.completedAt ?? row.createdAt),
      ...timelineHabits.map((row) => row.date),
      ...timelineMeals.map((row) => row.date),
      ...timelineWater.map((row) => row.date),
      ...timelineWeight.map((row) => row.date),
      ...timelineFinance.map((row) => row.createdAt),
      ...timelineNotes.map((row) => row.createdAt),
    ];

    const countsByDay = new Map<string, number>();
    for (const value of eventDates) {
      const key = dayKey(value, timezone);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }

    const timeline = eachDayOfInterval({ start: startLocal30, end: endLocal }).map((day) => {
      const date = format(day, 'yyyy-MM-dd');
      return { date, count: countsByDay.get(date) ?? 0 };
    });

    const events30 = timeline.reduce((sum, point) => sum + point.count, 0);
    const events7 = timeline.slice(-7).reduce((sum, point) => sum + point.count, 0);

    const recent: ActivityEvent[] = [
      ...recentMaterials.map((row) => ({
        at: row.createdAt.toISOString(),
        module: 'review' as const,
        action: 'created' as const,
      })),
      ...recentReminders.map((row) => ({
        at: (row.completedAt ?? new Date()).toISOString(),
        module: 'review' as const,
        action: 'completed' as const,
      })),
      ...recentTasks.map((row) => ({
        at: (row.completed && row.completedAt ? row.completedAt : row.updatedAt ?? row.createdAt).toISOString(),
        module: 'tasks' as const,
        action: row.completed ? ('completed' as const) : ('created' as const),
      })),
      ...recentHabits.map((row) => ({
        at: row.createdAt.toISOString(),
        module: 'habits' as const,
        action: 'checked' as const,
      })),
      ...recentMeals.map((row) => ({
        at: row.createdAt.toISOString(),
        module: 'nutrition' as const,
        action: 'logged' as const,
      })),
      ...recentWater.map((row) => ({
        at: row.updatedAt.toISOString(),
        module: 'nutrition' as const,
        action: 'logged' as const,
      })),
      ...recentWeight.map((row) => ({
        at: row.updatedAt.toISOString(),
        module: 'nutrition' as const,
        action: 'logged' as const,
      })),
      ...recentFinance.map((row) => ({
        at: row.createdAt.toISOString(),
        module: 'finance' as const,
        action: 'logged' as const,
      })),
      ...recentNotes.map((row) => ({
        at: row.updatedAt.toISOString(),
        module: 'notes' as const,
        action: row.updatedAt.getTime() === row.createdAt.getTime() ? ('created' as const) : ('logged' as const),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 20);

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      lastActivityAt: latestIso(...modules.map((item) => item.lastAt)),
      summary: {
        modulesUsed: modules.filter((item) => item.used).length,
        modulesTotal: modules.length,
        activeDays30: timeline.filter((point) => point.count > 0).length,
        events7,
        events30,
      },
      timeline,
      modules,
      recent,
    };
  }

  async getOverview() {
    const [usersTotal, materialsTotal, remindersTotal, adminsTotal] = await Promise.all([
      prisma.user.count(),
      prisma.learningMaterial.count(),
      prisma.reviewReminder.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      usersTotal,
      adminsTotal,
      materialsTotal,
      remindersTotal,
    };
  }

  async listReviews() {
    return prisma.userReview.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async moderateReview(id: string, input: ModerateReviewInput) {
    return prisma.userReview.update({
      where: { id },
      data: { status: input.status },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}

export const adminService = new AdminService();
