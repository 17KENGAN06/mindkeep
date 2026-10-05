import { useQuery, type QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { billingApi, type BillingStatus } from '@/api/billing';
import type { User, UserPlan } from '@/types/auth';

type Translate = (key: string) => string;

export type PlanLimitFeature =
  | 'materials'
  | 'reviewCategories'
  | 'habits'
  | 'notes'
  | 'tasks'
  | 'financeOperations'
  | 'financeCategories'
  | 'meals'
  | 'sessions';

function featureOf(error: ApiError): PlanLimitFeature | null {
  const details = error.details as { feature?: string } | undefined;
  const feature = details?.feature;
  const allowed: PlanLimitFeature[] = [
    'materials',
    'reviewCategories',
    'habits',
    'notes',
    'tasks',
    'financeOperations',
    'financeCategories',
    'meals',
    'sessions',
  ];
  return feature && allowed.includes(feature as PlanLimitFeature)
    ? (feature as PlanLimitFeature)
    : null;
}

export function planLimitMessage(error: unknown, t: Translate): string | null {
  if (!(error instanceof ApiError) || error.code !== 'PLAN_LIMIT') return null;
  const feature = featureOf(error);
  if (feature) return t(`billing.limits.${feature}`);
  return t('billing.limitReached');
}

export function mutationErrorMessage(error: unknown, t: Translate, fallbackKey = 'auth.errors.generic'): string {
  return planLimitMessage(error, t) ?? t(fallbackKey);
}

export function touchPlanUsage(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['billing'] });
}

export function usePlanUsage() {
  return useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => billingApi.status(),
    staleTime: 12_000,
  });
}

export type PlanUsageFeature = keyof BillingStatus['usage'];

export type PlanAccount = Pick<User, 'plan' | 'role' | 'betaTester'> | null | undefined;

export function accountPlan(user?: PlanAccount): UserPlan {
  if (!user) return 'FREE';
  if (user.role === 'ADMIN' || Boolean(user.betaTester)) return 'PRO';
  if (user.plan === 'PLUS' || user.plan === 'PRO') return user.plan;
  return 'FREE';
}

/** Quantity caps are lifted on Plus and Pro. */
export function isProAccount(user?: PlanAccount): boolean {
  return accountPlan(user) !== 'FREE';
}

export function isPaidAccount(user?: PlanAccount): boolean {
  return isProAccount(user);
}

/** Food and receipt scan — Pro only. */
export function hasAutomation(user?: PlanAccount): boolean {
  return accountPlan(user) === 'PRO';
}
