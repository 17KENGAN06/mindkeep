import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { billingApi } from '@/api/billing';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';
import { useAuth } from '@/features/auth/useAuth';

const APP_DEEP_LINK = 'mindkeep://';

export function BillingReturnPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const sessionId = searchParams.get('session_id');
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !sessionId || status !== 'success' || synced) return;
    void billingApi.sync(sessionId).finally(() => setSynced(true));
  }, [isAuthenticated, sessionId, status, synced]);

  const copy =
    status === 'canceled'
      ? t('billing.returnCanceled')
      : status === 'portal'
        ? t('billing.returnPortal')
        : t('billing.returnSuccess');

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <section className="mx-auto mt-16 max-w-xl rounded-[1.75rem] border border-brand-500/30 bg-panel p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand-500 uppercase">
            {t('billing.title')}
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink">
            {t('billing.returnTitle')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{copy}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={APP_DEEP_LINK}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-500 px-5 text-sm font-semibold text-[#07110d] no-underline"
            >
              {t('billing.openApp')}
            </a>
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-5 text-sm font-semibold text-ink no-underline"
            >
              {t('billing.stayOnSite')}
            </Link>
          </div>
        </section>

        <SiteFooter embedded />
      </div>
    </div>
  );
}
