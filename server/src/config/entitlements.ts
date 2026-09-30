import { AppError } from '@/utils/AppError.js';

export const FREE_LIMITS = {
  materials: 20,
  reviewCategories: 3,
  habits: 3,
  notes: 20,
  tasksPerMonth: 15,
  financeOperationsPerMonth: 25,
  financeCategories: 5,
  mealHistoryDays: 7,
  weightHistoryDays: 30,
  sessions: 2,
} as const;

export type PlanFeature =
  | 'materials'
  | 'reviewCategories'
  | 'habits'
  | 'notes'
  | 'tasks'
  | 'financeOperations'
  | 'financeCategories'
  | 'meals'
  | 'sessions';

export type PlanLimitDetails = {
  feature: PlanFeature;
  used: number;
  limit: number;
};

export function throwPlanLimit(feature: PlanFeature, used: number, limit: number): never {
  throw new AppError('Plan limit reached', {
    statusCode: 403,
    code: 'PLAN_LIMIT',
    details: { feature, used, limit } satisfies PlanLimitDetails,
  });
}

export function utcMonthRangeFromDateKey(dateKey: string): { from: Date; to: Date } {
  const [yearText, monthText] = dateKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  return {
    from: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
    to: new Date(Date.UTC(year, month, 1, 0, 0, 0)),
  };
}

export function dateKeyFromInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [yearText, monthText, dayText] = dateKey.split('-');
  const next = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText) + days, 12, 0, 0));
  return next.toISOString().slice(0, 10);
}

export function parseDateKeyUtc(dateKey: string): Date {
  const [yearText, monthText, dayText] = dateKey.split('-');
  return new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText), 12, 0, 0));
}
