import { ApiError } from '@/api/client';

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
