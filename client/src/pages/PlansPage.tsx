import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api/billing';
import { PlanCards } from '@/components/billing/PlanCards';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import { accountPlan } from '@/features/billing/planLimit';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';

type PaidPlan = 'plus' | 'pro';

export function PlansPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const current = accountPlan(user);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [busy, setBusy] = useState<'plus' | 'pro' | 'portal' | 'clear' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switchTarget, setSwitchTarget] = useState<PaidPlan | null>(null);
  const [immediateAck, setImmediateAck] = useState(false);

  const statusQuery = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => billingApi.status(),
    enabled: isAuthenticated,
  });
  const status = statusQuery.data;
  const subscribed =
    Boolean(status?.subscribed) ||
    ((current === 'PLUS' || current === 'PRO') && user?.role !== 'ADMIN' && !user?.betaTester);
  const expiresAt = status?.planExpiresAt ? new Date(status.planExpiresAt) : null;
  const expiresLabel = expiresAt
    ? expiresAt.toLocaleDateString(i18n.language, { dateStyle: 'medium' })
    : t('plans.periodEnd');
  const pendingPlan = status?.pendingPlan === 'PLUS' ? 'plus' : status?.pendingPlan === 'PRO' ? 'pro' : null;

  const startCheckout = async (plan: PaidPlan) => {
    if (!isAuthenticated) return;
    if (!immediateAck) {
      setError(t('plans.immediateAckNeed'));
      return;
    }
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

  const confirmSwitch = async () => {
    if (!switchTarget) return;
    setError(null);
    setBusy(switchTarget);
    try {
      await billingApi.change(switchTarget, interval);
      await queryClient.invalidateQueries({ queryKey: ['billing'] });
      setSwitchTarget(null);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  const clearPending = async () => {
    setError(null);
    setBusy('clear');
    try {
      await billingApi.clearChange();
      await queryClient.invalidateQueries({ queryKey: ['billing'] });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  const paidCta = (plan: PaidPlan, label: string) => {
    const isCurrent = (plan === 'plus' && current === 'PLUS') || (plan === 'pro' && current === 'PRO');
    const pendingHere = pendingPlan === plan;

    if (pendingHere) {
      return (
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-ink">{t('plans.switchScheduled', { date: expiresLabel })}</p>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-full"
            isLoading={busy === 'clear'}
            disabled={busy !== null}
            onClick={() => void clearPending()}
          >
            {t('plans.undoSwitch')}
          </Button>
        </div>
      );
    }

    if (isCurrent && subscribed) {
      return (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-full"
          isLoading={busy === 'portal'}
          disabled={busy !== null}
          onClick={() => void openPortal()}
        >
          {t('billing.manage')}
        </Button>
      );
    }

    if (subscribed) {
      return (
        <Button
          type="button"
          className="w-full gap-2 sm:w-full"
          disabled={busy !== null || Boolean(status?.cancelAtPeriodEnd)}
          onClick={() => setSwitchTarget(plan)}
        >
          {t('plans.switchTo', { plan: plan === 'plus' ? t('plans.plus.name') : t('plans.pro.name') })}
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
        disabled={busy !== null || !immediateAck}
        onClick={() => void startCheckout(plan)}
      >
        {interval === 'year' ? t('plans.ctaYear') : t('plans.ctaMonth')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    );
  };

  const switchName = switchTarget === 'plus' ? t('plans.plus.name') : t('plans.pro.name');
  const currentName =
    current === 'PLUS' ? t('plans.plus.name') : current === 'PRO' ? t('plans.pro.name') : t('plans.free.name');

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

        {status?.cancelAtPeriodEnd ? (
          <p className="mt-4 max-w-2xl rounded-2xl bg-brand-50/80 px-4 py-3 text-sm text-ink">
            {t('billing.cancelScheduled')}
          </p>
        ) : null}

        {isAuthenticated && !subscribed ? (
          <label className="mt-6 flex max-w-2xl cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-brand-500"
              checked={immediateAck}
              onChange={(event) => setImmediateAck(event.target.checked)}
            />
            <span>{t('plans.immediateAck')}</span>
          </label>
        ) : null}

        <div className="mt-8">
        <PlanCards
          currentPlan={isAuthenticated ? current : null}
            interval={interval}
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

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{t('plans.billingNote')}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {t('plans.refundNote')}{' '}
          <Link to="/refund" className="font-semibold text-brand-500 no-underline">
            {t('footer.refund')}
          </Link>
        </p>
        <SiteFooter embedded />
      </div>

      <ConfirmDialog
        open={switchTarget !== null}
        title={t('plans.switchTitle', { plan: switchName })}
        description={t('plans.switchConfirm', { plan: switchName, current: currentName, date: expiresLabel })}
        confirmLabel={t('plans.switchConfirmCta')}
        cancelLabel={t('common.cancel')}
        isLoading={busy === 'plus' || busy === 'pro'}
        onConfirm={() => void confirmSwitch()}
        onCancel={() => setSwitchTarget(null)}
      />
    </div>
  );
}
