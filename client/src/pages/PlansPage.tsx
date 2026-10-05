import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api/billing';
import { PlanCards } from '@/components/billing/PlanCards';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import { accountPlan } from '@/features/billing/planLimit';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';

export function PlansPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const current = accountPlan(user);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [busy, setBusy] = useState<'plus' | 'pro' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async (plan: 'plus' | 'pro') => {
    if (!isAuthenticated) return;
    setError(null);
    setBusy(plan);
    try {
      const result = await billingApi.checkout(interval, plan);
      window.location.assign(result.url);
    } catch (caught) {
      setError(mapAuthError(caught, t));
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    setBusy('portal');
    try {
      const result = await billingApi.portal();
      window.location.assign(result.url);
    } catch (caught) {
      setError(mapAuthError(caught, t));
      setBusy(null);
    }
  };

  const paidCta = (plan: 'plus' | 'pro', label: string) => {
    if (current === 'PRO' || (plan === 'plus' && current === 'PLUS')) {
      return (
        <Button type="button" variant="secondary" className="w-full sm:w-full" onClick={() => void openPortal()}>
          {t('billing.manage')}
        </Button>
      );
    }
    if (current === 'PLUS' && plan === 'pro') {
      return (
        <Button
          type="button"
          className="w-full gap-2 sm:w-full"
          isLoading={busy === 'portal'}
          disabled={busy !== null}
          onClick={() => void openPortal()}
        >
          {t('plans.upgrade')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      );
    }
    if (!isAuthenticated) {
      return (
        <Link to="/register" className="block">
          <Button className="w-full gap-2 sm:w-full">
            {label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      );
    }
    return (
      <Button
        type="button"
        className="w-full gap-2 sm:w-full"
        isLoading={busy === plan}
        disabled={busy !== null}
        onClick={() => void startCheckout(plan)}
      >
        {interval === 'year' ? t('plans.ctaYear') : t('plans.ctaMonth')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    );
  };

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-10 max-w-3xl sm:mt-14">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">{t('plans.eyebrow')}</p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('plans.title')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{t('plans.subtitle')}</p>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted">{t('plans.payHow')}</p>
          <div className="inline-flex rounded-full bg-brand-50/60 p-1 ring-1 ring-line">
            <button
              type="button"
              className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${
                interval === 'year' ? 'bg-brand-500 text-[#07110d]' : 'text-ink'
              }`}
              onClick={() => setInterval('year')}
            >
              {t('plans.intervalYear')}
            </button>
            <button
              type="button"
              className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${
                interval === 'month' ? 'bg-brand-500 text-[#07110d]' : 'text-ink'
              }`}
              onClick={() => setInterval('month')}
            >
              {t('plans.intervalMonth')}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <ErrorMessage message={error ?? undefined} />
        </div>

        <div className="mt-8">
          <PlanCards
            currentPlan={current}
            actions={{
              free: isAuthenticated ? (
                <Link to="/dashboard" className="block">
                  <Button variant="secondary" className="w-full sm:w-full">
                    {t('nav.dashboard')}
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="block">
                  <Button variant="secondary" className="w-full sm:w-full">
                    {t('plans.ctaFree')}
                  </Button>
                </Link>
              ),
              plus: paidCta('plus', t('plans.ctaPlus')),
              pro: paidCta('pro', t('plans.ctaPro')),
            }}
          />
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{t('billing.paidInBrowser')}</p>
      </div>

      <SiteFooter embedded />
    </div>
  );
}
