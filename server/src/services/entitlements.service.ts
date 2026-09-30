import { MaterialStatus, UserPlan, UserRole } from '@prisma/client';
import {
  FREE_LIMITS,
  dateKeyFromInput,
  parseDateKeyUtc,
  shiftDateKey,
  throwPlanLimit,
  utcMonthRangeFromDateKey,
  type PlanFeature,
} from '@/config/entitlements.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { todayKeyInTimeZone } from '@/utils/timezone.js';

export type EntitlementUser = {
  id: string;
  email: string;
  role: UserRole;
  timezone: string;
  plan: UserPlan;
  planExpiresAt: Date | null;
};

const entitlementSelect = {
  id: true,
  email: true,
  role: true,
  timezone: true,
  plan: true,
  planExpiresAt: true,
} as const;

export function isProUser(user: Pick<EntitlementUser, 'email' | 'role' | 'plan' | 'planExpiresAt'>): boolean {
  if (user.role === UserRole.ADMIN || env.ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }
  if (user.plan !== UserPlan.PRO) return false;
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function getEntitlement(userId: string): Promise<EntitlementUser & { pro: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: entitlementSelect,
  });

  if (!user) {
    return {
      id: userId,
      email: '',
      role: UserRole.USER,
      timezone: 'Europe/Helsinki',
      plan: UserPlan.FREE,
      planExpiresAt: null,
      pro: false,
    };
  }

  return { ...user, pro: isProUser(user) };
}

async function usedFor(
  userId: string,
  feature: PlanFeature,
  extra?: { dateKey?: string },
): Promise<{ used: number; limit: number }> {
  switch (feature) {
    case 'materials':
      return {
        used: await prisma.learningMaterial.count({
          where: { userId, status: MaterialStatus.ACTIVE },
        }),
        limit: FREE_LIMITS.materials,
      };
    case 'reviewCategories':
      return {
        used: await prisma.category.count({ where: { userId } }),
        limit: FREE_LIMITS.reviewCategories,
      };
    case 'habits':
      return {
        used: await prisma.habit.count({ where: { userId, isActive: true } }),
        limit: FREE_LIMITS.habits,
      };
    case 'notes':
      return {
        used: await prisma.note.count({ where: { userId } }),
        limit: FREE_LIMITS.notes,
      };
    case 'tasks': {
      const dateKey = extra?.dateKey ?? new Date().toISOString().slice(0, 10);
      const { from, to } = utcMonthRangeFromDateKey(dateKey);
      return {
        used: await prisma.dailyTask.count({
          where: { userId, date: { gte: from, lt: to } },
        }),
        limit: FREE_LIMITS.tasksPerMonth,
      };
    }
    case 'financeOperations': {
      const dateKey = extra?.dateKey ?? new Date().toISOString().slice(0, 10);
      const { from, to } = utcMonthRangeFromDateKey(dateKey);
      return {
        used: await prisma.budgetOperation.count({
          where: { userId, date: { gte: from, lt: to } },
        }),
        limit: FREE_LIMITS.financeOperationsPerMonth,
      };
    }
    case 'financeCategories':
      return {
        used: await prisma.budgetCategory.count({ where: { userId } }),
        limit: FREE_LIMITS.financeCategories,
      };
    case 'sessions':
      return {
        used: await prisma.authSession.count({
          where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        }),
        limit: FREE_LIMITS.sessions,
      };
    case 'meals':
      return { used: FREE_LIMITS.mealHistoryDays, limit: FREE_LIMITS.mealHistoryDays };
    default:
      return { used: 0, limit: 0 };
  }
}

export async function assertCreateLimit(
  userId: string,
  feature: Exclude<PlanFeature, 'meals' | 'sessions'>,
  extra?: { dateKey?: string },
): Promise<void> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return;
  const { used, limit } = await usedFor(userId, feature, extra);
  if (used >= limit) throwPlanLimit(feature, used, limit);
}

export async function assertMealDateAllowed(userId: string, dateKey: string): Promise<void> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return;
  const today = todayKeyInTimeZone(entitlement.timezone);
  const oldest = shiftDateKey(today, -FREE_LIMITS.mealHistoryDays);
  if (dateKey < oldest) {
    throwPlanLimit('meals', FREE_LIMITS.mealHistoryDays + 1, FREE_LIMITS.mealHistoryDays);
  }
}

export async function mealHistoryFrom(userId: string, requestedFrom: Date): Promise<Date> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return requestedFrom;
  const today = todayKeyInTimeZone(entitlement.timezone);
  const oldest = parseDateKeyUtc(shiftDateKey(today, -FREE_LIMITS.mealHistoryDays));
  oldest.setUTCHours(0, 0, 0, 0);
  return oldest.getTime() > requestedFrom.getTime() ? oldest : requestedFrom;
}

export async function weightHistoryFrom(userId: string, requestedFrom: Date): Promise<Date> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return requestedFrom;
  const today = todayKeyInTimeZone(entitlement.timezone);
  const oldest = parseDateKeyUtc(shiftDateKey(today, -FREE_LIMITS.weightHistoryDays));
  oldest.setUTCHours(0, 0, 0, 0);
  return oldest.getTime() > requestedFrom.getTime() ? oldest : requestedFrom;
}

export async function enforceSessionLimit(userId: string): Promise<void> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return;

  const active = await prisma.authSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const keep = FREE_LIMITS.sessions - 1;
  if (active.length <= keep) return;

  const revokeIds = active.slice(0, active.length - keep).map((row) => row.id);
  await prisma.authSession.updateMany({
    where: { id: { in: revokeIds }, userId },
    data: { revokedAt: new Date() },
  });
}

export async function getUsageSnapshot(userId: string) {
  const entitlement = await getEntitlement(userId);
  const today = todayKeyInTimeZone(entitlement.timezone);
  const [
    materials,
    reviewCategories,
    habits,
    notes,
    tasks,
    financeOperations,
    financeCategories,
    sessions,
  ] = await Promise.all([
    usedFor(userId, 'materials'),
    usedFor(userId, 'reviewCategories'),
    usedFor(userId, 'habits'),
    usedFor(userId, 'notes'),
    usedFor(userId, 'tasks', { dateKey: today }),
    usedFor(userId, 'financeOperations', { dateKey: today }),
    usedFor(userId, 'financeCategories'),
    usedFor(userId, 'sessions'),
  ]);

  const unlimited = entitlement.pro;

  return {
    pro: entitlement.pro,
    timezone: entitlement.timezone,
    usage: {
      materials: { used: materials.used, limit: unlimited ? null : materials.limit },
      reviewCategories: {
        used: reviewCategories.used,
        limit: unlimited ? null : reviewCategories.limit,
      },
      habits: { used: habits.used, limit: unlimited ? null : habits.limit },
      notes: { used: notes.used, limit: unlimited ? null : notes.limit },
      tasks: { used: tasks.used, limit: unlimited ? null : tasks.limit },
      financeOperations: {
        used: financeOperations.used,
        limit: unlimited ? null : financeOperations.limit,
      },
      financeCategories: {
        used: financeCategories.used,
        limit: unlimited ? null : financeCategories.limit,
      },
      sessions: { used: sessions.used, limit: unlimited ? null : sessions.limit },
      meals: {
        used: 0,
        limit: unlimited ? null : FREE_LIMITS.mealHistoryDays,
      },
    },
  };
}

export function dateKeyOf(value: string): string {
  return dateKeyFromInput(value);
}
