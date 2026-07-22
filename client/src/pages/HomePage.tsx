import { ArrowRight, CalendarDays, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const intervals = [
  { key: 'three', days: '3' },
  { key: 'seven', days: '7' },
  { key: 'thirty', days: '30' },
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        <header className="animate-fade z-10 flex items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {t('common.appName')}
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Hero — one composition */}
        <section className="relative flex min-h-[78dvh] flex-1 flex-col justify-end pb-10 pt-16 sm:justify-center sm:pb-16 sm:pt-10">
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute inset-x-[-10%] top-[8%] -z-10 h-[55%] rounded-[40%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_68%)]"
          />

          <p className="animate-rise font-display text-sm font-medium tracking-[0.18em] text-brand-500 uppercase">
            {t('common.appName')}
          </p>

          <h1 className="animate-rise-delay-1 font-display mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            {t('home.title')}
          </h1>

          <p className="animate-rise-delay-2 mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t('home.subtitle')}
          </p>

          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="min-w-40 gap-2">
                  {t('nav.dashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button className="min-w-40 gap-2">
                    {t('home.ctaRegister')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="min-w-40">
                    {t('home.ctaLogin')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Schedule */}
      <section className="border-t border-line bg-panel/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('home.scheduleTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{t('home.scheduleSubtitle')}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {intervals.map((item, index) => (
              <div
                key={item.key}
                className="relative overflow-hidden rounded-3xl border border-line bg-surface/70 p-6"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="font-display text-5xl font-semibold text-brand-500">{item.days}</p>
                <p className="mt-1 text-sm tracking-wide text-muted uppercase">
                  {t('home.daysLabel')}
                </p>
                <p className="mt-4 text-base font-medium text-ink">
                  {t(`home.intervals.${item.key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('home.howTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{t('home.howSubtitle')}</p>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <li key={step} className="border-l border-brand-400/50 pl-5">
                <p className="font-display text-sm font-semibold text-brand-500">
                  {t('home.stepLabel', { n: step })}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-ink">
                  {t(`home.steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`home.steps.${step}.text`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-panel/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('home.featuresTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{t('home.featuresSubtitle')}</p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-line bg-surface/60 p-6">
              <CalendarDays className="h-6 w-6 text-brand-500" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{t('home.features.calendar.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t('home.features.calendar.text')}
              </p>
            </article>
            <article className="rounded-3xl border border-line bg-surface/60 p-6">
              <Layers3 className="h-6 w-6 text-brand-500" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{t('home.features.materials.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t('home.features.materials.text')}
              </p>
            </article>
            <article className="rounded-3xl border border-line bg-surface/60 p-6">
              <Sparkles className="h-6 w-6 text-brand-500" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{t('home.features.focus.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t('home.features.focus.text')}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-3 text-muted">{t('home.ctaSubtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/review">
                <Button className="gap-2">
                  {t('nav.review')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button className="gap-2">
                  {t('home.ctaRegister')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
