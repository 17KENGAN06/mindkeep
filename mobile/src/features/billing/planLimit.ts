import { useQuery, type QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/client';
import { billingApi, type BillingStatus } from '../../api/billing';
import type { User } from '../../types/auth';

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

export function isProAccount(user?: Pick<User, 'plan' | 'role' | 'betaTester'> | null): boolean {
  if (!user) return false;
  return user.plan === 'PRO' || user.plan === 'PLUS' || user.role === 'ADMIN' || Boolean(user.betaTester);
}
