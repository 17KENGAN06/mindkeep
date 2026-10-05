import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { accountPlan } from '@/features/billing/planLimit';
import type { User } from '@/types/auth';

export function PlanChip({ user }: { user?: Pick<User, 'plan' | 'role' | 'betaTester'> | null }) {
  const { t } = useTranslation();
  const plan = accountPlan(user);
  const label =
    plan === 'PRO' ? t('billing.proLabel') : plan === 'PLUS' ? t('billing.plusLabel') : t('billing.freeLabel');

  return (
    <Link
      to="/plans"
      aria-label={label}
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase no-underline sm:px-3 sm:text-[11px] ${
        plan === 'FREE'
          ? 'bg-panel/90 text-muted ring-1 ring-line'
          : 'bg-brand-500 text-[#07110d] shadow-[0_8px_18px_-12px_rgba(53,111,88,0.9)]'
      }`}
    >
      {label}
    </Link>
  );
}
