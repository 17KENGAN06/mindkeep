import { useState } from 'react';
import { ArrowRight, ArrowUp, CalendarDays, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { BlogPreview } from '@/components/blog/ArticleCard';
import { AnimatedSnapSection } from '@/components/home/AnimatedSnapSection';
import { SectionNav } from '@/components/home/SectionNav';
import { useSectionSnapScroll } from '@/components/home/useSectionSnapScroll';
import { StoreComingSoon } from '@/components/home/StoreComingSoon';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const intervals = [
  { key: 'three', days: '3' },
  { key: 'seven', days: '7' },
  { key: 'thirty', days: '30' },
] as const;

const SECTION_IDS = [
  'hero',
  'schedule',
  'how',
  'features',
  'apps',
  'testimonials',
  'blog',
  'cta',
] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const sectionIds = SECTION_IDS as unknown as string[];
  const { activeId, goToSection } = useSectionSnapScroll(sectionIds, scroller);

  const labels = [
    t('home.sections.hero'),
    t('home.sections.schedule'),
    t('home.sections.how'),
    t('home.sections.features'),
    t('home.sections.apps'),
    t('home.sections.testimonials'),
    t('home.sections.blog'),
    t('home.sections.cta'),
  ];

  return (
    <div className="relative min-h-dvh md:h-dvh md:overflow-hidden">
      <SectionNav
        sectionIds={sectionIds}
        labels={labels}
        activeId={activeId}
        onSelect={goToSection}
      />

      {activeId !== 'hero' ? (
        <button
          type="button"
          onClick={() => goToSection('hero')}
          className="fixed right-4 bottom-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel/90 text-ink shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          aria-label={t('nav.home')}
          title={t('nav.home')}
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      <div
        ref={setScroller}
        className="home-snap min-h-dvh overflow-x-hidden md:h-dvh md:overflow-y-auto"
        data-section-snap="true"
      >
        <AnimatedSnapSection id="hero" activeId={activeId}>
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6">
            <header className="snap-reveal z-10 flex items-center justify-between gap-3">
              <BrandLockup to="/" size="lg" />
              <div className="flex items-center gap-2">
                <nav
                  className="hidden items-center gap-1 lg:flex"
                  aria-label={t('footer.linksLabel')}
                >
                  <Link
                    to="/guide"
                    className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-xs font-semibold text-muted no-underline transition hover:bg-brand-50 hover:text-ink"
                  >
                    {t('nav.guide')}
                  </Link>
                </nav>
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </header>

            <div className="relative flex flex-1 flex-col justify-center pb-20 pt-10">
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute inset-x-[-12%] top-[5%] -z-10 h-[60%] rounded-[45%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_70%)]"
              />
              <div
                aria-hidden
                className="desktop-motion desktop-motion-line origin-left top-8 left-0 h-px w-52 bg-gradient-to-r from-brand-500/80 to-transparent"
              />
              <div
                aria-hidden
                className="desktop-motion desktop-motion-glow right-8 bottom-24 h-44 w-44 rounded-full bg-brand-500/10 blur-3xl"
              />

              <p className="snap-reveal snap-reveal-d1 snap-reveal-left font-display text-sm font-medium tracking-[0.28em] text-brand-500 uppercase">
                {t('home.eyebrow')}
              </p>

              <h1 className="snap-reveal snap-reveal-d2 snap-reveal-scale font-display mt-5 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
                {t('home.title')}
              </h1>

              <p className="snap-reveal snap-reveal-d3 snap-reveal-right mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {t('home.subtitle')}
              </p>

              <div className="snap-reveal snap-reveal-d4 snap-pop mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="w-full sm:w-auto">
                    <Button className="min-w-44 gap-2">
                      {t('nav.dashboard')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="w-full sm:w-auto">
                      <Button className="min-w-44 gap-2">
                        {t('home.ctaRegister')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto">
                      <Button variant="secondary" className="min-w-44">
                        {t('home.ctaLogin')}
                      </Button>
                    </Link>
                  </>
                )}
                <Link
                  to="/guide"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink no-underline sm:hidden"
                >
                  {t('nav.guide')}
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="schedule" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-glow -top-8 left-1/4 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl"
            />
            <div
              aria-hidden
              className="desktop-motion desktop-motion-line origin-left top-24 left-4 h-px w-40 bg-gradient-to-r from-brand-500/70 to-transparent"
            />
            <h2 className="snap-reveal snap-reveal-left font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t('home.scheduleTitle')}
            </h2>
            <p className="snap-reveal snap-reveal-d1 snap-reveal-left mt-4 max-w-2xl text-base text-muted sm:text-lg">
              {t('home.scheduleSubtitle')}
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {intervals.map((item, index) => (
                <div
                  key={item.key}
                  className={`snap-reveal snap-reveal-d${index + 2} snap-reveal-scale snap-pop glass-panel relative overflow-hidden rounded-[1.75rem] p-7`}
                >
                  <div
                    aria-hidden
                    className="animate-pulse-soft pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-500/15 blur-2xl"
                  />
                  <p className="font-display text-6xl font-semibold text-brand-500">{item.days}</p>
                  <p className="mt-2 text-xs tracking-[0.2em] text-muted uppercase">
                    {t('home.daysLabel')}
                  </p>
                  <p className="mt-5 text-base font-medium leading-relaxed text-ink">
                    {t(`home.intervals.${item.key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="how" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-line origin-right top-20 right-6 h-px w-48 bg-gradient-to-l from-brand-500/70 to-transparent"
            />
            <h2 className="snap-reveal snap-reveal-right font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t('home.howTitle')}
            </h2>
            <p className="snap-reveal snap-reveal-d1 snap-reveal-right mt-4 max-w-2xl text-base text-muted sm:text-lg">
              {t('home.howSubtitle')}
            </p>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((step) => (
                <li
                  key={step}
                  className={`snap-reveal snap-reveal-d${step + 1} ${
                    step % 2 === 0 ? 'snap-reveal-right' : 'snap-reveal-left'
                  } glass-panel rounded-[1.75rem] border-l-2 border-l-brand-500 p-6`}
                >
                  <p className="font-display text-sm font-semibold tracking-wide text-brand-500">
                    {t('home.stepLabel', { n: step })}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
                    {t(`home.steps.${step}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    {t(`home.steps.${step}.text`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="features" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-glow top-10 right-1/4 h-48 w-48 rounded-full bg-brand-500/12 blur-3xl"
            />
            <h2 className="snap-reveal snap-reveal-scale font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t('home.featuresTitle')}
            </h2>
            <p className="snap-reveal snap-reveal-d1 snap-reveal-scale mt-4 max-w-2xl text-base text-muted sm:text-lg">
              {t('home.featuresSubtitle')}
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <article className="snap-reveal snap-reveal-d2 snap-reveal-left snap-pop glass-panel rounded-[1.75rem] p-7">
                <CalendarDays className="h-7 w-7 text-brand-500" />
                <h3 className="mt-5 text-xl font-semibold text-ink">
                  {t('home.features.calendar.title')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {t('home.features.calendar.text')}
                </p>
              </article>
              <article className="snap-reveal snap-reveal-d3 snap-reveal-scale snap-pop glass-panel rounded-[1.75rem] p-7">
                <Layers3 className="h-7 w-7 text-brand-500" />
                <h3 className="mt-5 text-xl font-semibold text-ink">
                  {t('home.features.materials.title')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {t('home.features.materials.text')}
                </p>
              </article>
              <article className="snap-reveal snap-reveal-d4 snap-reveal-right snap-pop glass-panel rounded-[1.75rem] p-7">
                <Sparkles className="h-7 w-7 text-brand-500" />
                <h3 className="mt-5 text-xl font-semibold text-ink">
                  {t('home.features.focus.title')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {t('home.features.focus.text')}
                </p>
              </article>
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="apps" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-line origin-left bottom-24 left-8 h-px w-56 bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
            />
            <StoreComingSoon animated />
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection
          id="testimonials"
          activeId={activeId}
          className="border-t border-line/70"
        >
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-glow top-1/4 right-1/4 h-40 w-40 rounded-full bg-brand-500/12 blur-3xl"
            />
            <TestimonialsSection animated />
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="blog" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <div
              aria-hidden
              className="desktop-motion desktop-motion-glow -bottom-4 left-1/3 h-36 w-36 rounded-full bg-brand-500/14 blur-3xl"
            />
            <BlogPreview animated />
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="cta" activeId={activeId} className="border-t border-line/70">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-between overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex flex-1 flex-col items-stretch justify-center gap-6 mb-5 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div className="snap-reveal snap-reveal-left max-w-xl">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {t('home.ctaTitle')}
                </h2>
                <p className="mt-4 text-base text-muted sm:text-lg">{t('home.ctaSubtitle')}</p>
              </div>
              <div className="snap-reveal snap-reveal-d2 snap-reveal-right flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {isAuthenticated ? (
                  <Link to="/review" className="w-full sm:w-auto">
                    <Button className="min-w-44 gap-2">
                      {t('nav.review')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button className="min-w-44 gap-2">
                      {t('home.ctaRegister')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="snap-reveal snap-reveal-d3">
              <SiteFooter compact />
            </div>
          </div>
        </AnimatedSnapSection>
      </div>
    </div>
  );
}
