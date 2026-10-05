import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type PlansCtaProps = {
  className?: string;
};

export function PlansCta({ className = '' }: PlansCtaProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  if (pathname === '/plans') return null;

  return (
    <Link
      to="/plans"
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline shadow-[0_10px_22px_-14px_rgba(53,111,88,0.95)] transition hover:bg-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none xl:px-3.5 ${className}`}
    >
      <span className="xl:hidden">{t('nav.plansShort')}</span>
      <span className="hidden xl:inline">{t('nav.plans')}</span>
    </Link>
  );
}
