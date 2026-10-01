import { useTranslation } from 'react-i18next';
import { usePlanUsage, type PlanUsageFeature } from '@/features/billing/planLimit';

export function PlanRemain({ feature }: { feature: PlanUsageFeature }) {
  const { t } = useTranslation();
  const usageQuery = usePlanUsage();
  const item = usageQuery.data?.usage[feature];
  if (!item || item.limit == null) return null;

  const left = Math.max(0, item.limit - item.used);
  const tight = left === 0 || item.used / item.limit >= 0.85;

  return (
    <p
      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
        tight
          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20'
          : 'bg-panel text-muted ring-1 ring-line'
      }`}
    >
      {feature === 'meals'
        ? t('billing.remainDays', { count: item.limit })
        : t('billing.remain', { left, limit: item.limit })}
    </p>
  );
}
