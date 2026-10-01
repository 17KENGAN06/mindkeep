import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isProAccount } from '@/features/billing/planLimit';
import type { User } from '@/types/auth';

export function PlanChip({ user }: { user?: Pick<User, 'plan' | 'role' | 'betaTester'> | null }) {
  const { t } = useTranslation();
  const pro = isProAccount(user);

  return (
    <Link
      to="/account"
      aria-label={pro ? t('dashboard.planPro') : t('dashboard.planFree')}
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase no-underline sm:px-3 sm:text-[11px] ${
        pro
          ? 'bg-brand-500 text-[#07110d] shadow-[0_8px_18px_-12px_rgba(53,111,88,0.9)]'
          : 'bg-panel/90 text-muted ring-1 ring-line'
      }`}
    >
      {pro ? t('dashboard.planPro') : t('dashboard.planFree')}
    </Link>
  );
}
