import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SnapReveal } from '@/components/home/SnapReveal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const FREE_POINTS = ['open', 'caps', 'start'] as const;
const PRO_POINTS = ['unlimited', 'history', 'devices'] as const;

export function HomePricing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const proHref = isAuthenticated ? '/account' : '/register';

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <SnapReveal direction="left">
        <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
          {t('home.pricing.eyebrow')}
        </p>
        <h2 className="font-display mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:mt-3 sm:text-4xl xl:text-5xl">
          {t('home.pricing.title')}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base xl:text-lg">
          {t('home.pricing.subtitle')}
        </p>
      </SnapReveal>

      <div className="mt-6 grid gap-3 lg:mt-8 lg:grid-cols-2 lg:gap-5">
        <SnapReveal delay={0.08}>
          <article className="flex h-full flex-col rounded-[1.6rem] border border-line bg-panel/70 p-5 sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              {t('billing.freeLabel')}
            </p>
            <p className="font-display mt-3 text-4xl font-semibold text-ink">{t('home.pricing.freePrice')}</p>
            <p className="mt-2 text-sm text-muted">{t('home.pricing.freeHint')}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_POINTS.map((key) => (
                <li key={key} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                  {t(`home.pricing.freePoints.${key}`)}
                </li>
              ))}
            </ul>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="mt-7">
              <Button variant="secondary" className="w-full sm:w-full">
                {isAuthenticated ? t('nav.dashboard') : t('home.ctaRegister')}
              </Button>
            </Link>
          </article>
        </SnapReveal>

        <SnapReveal delay={0.14}>
          <article className="relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-brand-500/50 bg-gradient-to-br from-brand-500/20 via-panel to-panel p-5 shadow-[0_20px_50px_-32px_rgba(53,111,88,0.7)] sm:p-7">
            <span className="absolute top-5 right-5 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#07110d] uppercase">
              {t('home.pricing.recommended')}
            </span>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-500 uppercase">
              {t('billing.proLabel')}
            </p>
            <p className="font-display mt-3 text-4xl font-semibold text-ink">{t('billing.subscribeYear')}</p>
            <p className="mt-2 text-sm text-muted">
              {t('billing.subscribeMonth')} · {t('home.pricing.yearHint')}
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PRO_POINTS.map((key) => (
                <li key={key} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
                  {t(`home.pricing.proPoints.${key}`)}
                </li>
              ))}
            </ul>
            <Link to={proHref} className="mt-7">
              <Button className="w-full gap-2 sm:w-full">
                {t('home.pricing.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </article>
        </SnapReveal>
      </div>
    </div>
  );
}
