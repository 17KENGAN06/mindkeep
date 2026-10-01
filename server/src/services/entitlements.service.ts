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
  betaTester: boolean;
};

const entitlementSelect = {
  id: true,
  email: true,
  role: true,
  timezone: true,
  plan: true,
  planExpiresAt: true,
  betaTester: true,
} as const;

export function isProUser(
  user: Pick<EntitlementUser, 'email' | 'role' | 'plan' | 'planExpiresAt' | 'betaTester'>,
): boolean {
  if (user.role === UserRole.ADMIN || env.ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }
  if (user.betaTester) return true;
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
      betaTester: false,
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
  const shown = (item: { used: number; limit: number }) => ({
    used: unlimited ? item.used : Math.min(item.used, item.limit),
    limit: unlimited ? null : item.limit,
  });

  return {
    pro: entitlement.pro,
    timezone: entitlement.timezone,
    usage: {
      materials: shown(materials),
      reviewCategories: shown(reviewCategories),
      habits: shown(habits),
      notes: shown(notes),
      tasks: shown(tasks),
      financeOperations: shown(financeOperations),
      financeCategories: shown(financeCategories),
      sessions: shown(sessions),
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

export async function freeVisibleIds(
  userId: string,
  feature: Exclude<PlanFeature, 'meals' | 'sessions'>,
  extra?: { dateKey?: string },
): Promise<string[] | null> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return null;

  const { used, limit } = await usedFor(userId, feature, extra);
  if (used <= limit) return null;

  switch (feature) {
    case 'materials':
      return (
        await prisma.learningMaterial.findMany({
          where: { userId, status: MaterialStatus.ACTIVE },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    case 'notes':
      return (
        await prisma.note.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    case 'habits':
      return (
        await prisma.habit.findMany({
          where: { userId, isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    case 'reviewCategories':
      return (
        await prisma.category.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    case 'financeCategories':
      return (
        await prisma.budgetCategory.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    case 'tasks': {
      const dateKey = extra?.dateKey ?? new Date().toISOString().slice(0, 10);
      const { from, to } = utcMonthRangeFromDateKey(dateKey);
      return (
        await prisma.dailyTask.findMany({
          where: { userId, date: { gte: from, lt: to } },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    }
    case 'financeOperations': {
      const dateKey = extra?.dateKey ?? new Date().toISOString().slice(0, 10);
      const { from, to } = utcMonthRangeFromDateKey(dateKey);
      return (
        await prisma.budgetOperation.findMany({
          where: { userId, date: { gte: from, lt: to } },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: limit,
          select: { id: true },
        })
      ).map((row) => row.id);
    }
    default:
      return null;
  }
}

export function idIn(ids: string[] | null): { id: { in: string[] } } | Record<string, never> {
  return ids ? { id: { in: ids } } : {};
}

export async function capFreeRows<T>(
  userId: string,
  limit: number,
  rows: T[],
  recency: (row: T) => number,
): Promise<T[]> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro || rows.length <= limit) return rows;
  return [...rows].sort((left, right) => recency(right) - recency(left)).slice(0, limit);
}

export function keepLatestPerUtcMonth<T>(
  rows: T[],
  limit: number,
  dateOf: (row: T) => Date,
  recency: (row: T) => number,
): T[] {
  const buckets = new Map<string, T[]>();
  for (const row of rows) {
    const date = dateOf(row);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }
  const kept = new Set<T>();
  for (const list of buckets.values()) {
    list.sort((left, right) => recency(right) - recency(left));
    for (const row of list.slice(0, limit)) kept.add(row);
  }
  return rows.filter((row) => kept.has(row));
}

export async function maybeCapMonthly<T>(
  userId: string,
  limit: number,
  rows: T[],
  dateOf: (row: T) => Date,
  recency: (row: T) => number,
): Promise<T[]> {
  const entitlement = await getEntitlement(userId);
  if (entitlement.pro) return rows;
  return keepLatestPerUtcMonth(rows, limit, dateOf, recency);
}
