import { useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  Layers3,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { BlogPreview } from '@/components/blog/ArticleCard';
import { AnimatedSnapSection } from '@/components/home/AnimatedSnapSection';
import { HeroStage } from '@/components/home/HeroStage';
import { SectionNav } from '@/components/home/SectionNav';
import { MobileHomeNav } from '@/components/home/MobileHomeNav';
import { SnapReveal } from '@/components/home/SnapReveal';
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

const pillars = [
  { key: 'tasks', icon: CheckSquare },
  { key: 'repetition', icon: GraduationCap },
  { key: 'finance', icon: Wallet },
] as const;

const features = [
  { key: 'planning', icon: CheckSquare },
  { key: 'memory', icon: Layers3 },
  { key: 'money', icon: Wallet },
  { key: 'calendar', icon: CalendarDays },
] as const;

const SECTION_IDS = [
  'hero',
  'pillars',
  'how',
  'rhythm',
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
    t('home.sections.pillars'),
    t('home.sections.how'),
    t('home.sections.rhythm'),
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
      <MobileHomeNav
        sectionIds={sectionIds}
        labels={labels}
        activeId={activeId}
        onSelect={goToSection}
      />

      {activeId !== 'hero' ? (
        <button
          type="button"
          onClick={() => goToSection('hero')}
          className="fixed right-4 bottom-24 z-50 hidden h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel/90 text-ink shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none md:inline-flex md:bottom-5"
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
            <SnapReveal
              className="z-10 flex items-center justify-between gap-2 sm:gap-3"
              delay={0.02}
            >
              <BrandLockup to="/" size="lg" className="min-w-0 max-w-[55%] sm:max-w-none" />
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
                  <Link
                    to="/blog"
                    className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-xs font-semibold text-muted no-underline transition hover:bg-brand-50 hover:text-ink"
                  >
                    {t('nav.blog')}
                  </Link>
                </nav>
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </SnapReveal>

            <div className="relative grid flex-1 items-center gap-10 pb-16 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:pb-10 lg:pt-6">
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute inset-x-[-12%] top-[5%] -z-10 h-[60%] rounded-[45%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_70%)] lg:left-[-8%] lg:w-[70%]"
              />

              <div className="relative">
                <SnapReveal direction="left" delay={0.08}>
                  <p className="font-display text-sm font-medium tracking-[0.28em] text-brand-500 uppercase">
                    {t('home.eyebrow')}
                  </p>
                </SnapReveal>

                <SnapReveal direction="scale" delay={0.16}>
                  <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-tight text-ink sm:text-6xl lg:text-[3.6rem] xl:text-7xl">
                    {t('home.title')}
                  </h1>
                </SnapReveal>

                <SnapReveal direction="right" delay={0.26}>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                    {t('home.subtitle')}
                  </p>
                </SnapReveal>

                <SnapReveal delay={0.36}>
                  <div className="mt-8 hidden gap-6 border-y border-line/70 py-4 lg:grid lg:grid-cols-3">
                    {pillars.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="min-w-0">
                          <div className="flex items-center gap-2 text-brand-500">
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            <p className="truncate text-xs font-semibold tracking-wide uppercase">
                              {t(`home.pillars.${item.key}.title`)}
                            </p>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                            {t(`home.heroHighlights.${item.key}`)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </SnapReveal>

                <SnapReveal delay={0.46}>
                  <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
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
                </SnapReveal>
              </div>

              <SnapReveal direction="right" delay={0.28} className="h-full">
                <HeroStage />
              </SnapReveal>
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="pillars" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal direction="left">
              <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                {t('home.pillarsTitle')}
              </h2>
            </SnapReveal>
            <SnapReveal direction="left" delay={0.08}>
              <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
                {t('home.pillarsSubtitle')}
              </p>
            </SnapReveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {pillars.map((item, index) => {
                const Icon = item.icon;
                return (
                  <SnapReveal key={item.key} direction="scale" delay={0.12 + index * 0.08}>
                    <article className="glass-panel relative h-full overflow-hidden rounded-[1.75rem] p-7">
                      <div
                        aria-hidden
                        className="animate-pulse-soft pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-500/15 blur-2xl"
                      />
                      <Icon className="h-8 w-8 text-brand-500" aria-hidden />
                      <h3 className="mt-5 text-xl font-semibold text-ink sm:text-2xl">
                        {t(`home.pillars.${item.key}.title`)}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                        {t(`home.pillars.${item.key}.text`)}
                      </p>
                    </article>
                  </SnapReveal>
                );
              })}
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="how" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal direction="right">
              <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                {t('home.howTitle')}
              </h2>
            </SnapReveal>
            <SnapReveal direction="right" delay={0.08}>
              <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{t('home.howSubtitle')}</p>
            </SnapReveal>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((step) => (
                <SnapReveal
                  key={step}
                  direction={step % 2 === 0 ? 'right' : 'left'}
                  delay={0.1 + step * 0.08}
                >
                  <li className="glass-panel h-full rounded-[1.75rem] border-l-2 border-l-brand-500 p-6">
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
                </SnapReveal>
              ))}
            </ol>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="rhythm" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal direction="left">
              <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                {t('home.rhythmTitle')}
              </h2>
            </SnapReveal>
            <SnapReveal direction="left" delay={0.08}>
              <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
                {t('home.rhythmSubtitle')}
              </p>
            </SnapReveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {intervals.map((item, index) => (
                <SnapReveal key={item.key} direction="scale" delay={0.12 + index * 0.08}>
                  <div className="glass-panel relative h-full overflow-hidden rounded-[1.75rem] p-7">
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
                </SnapReveal>
              ))}
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="features" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal direction="scale">
              <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                {t('home.featuresTitle')}
              </h2>
            </SnapReveal>
            <SnapReveal direction="scale" delay={0.08}>
              <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
                {t('home.featuresSubtitle')}
              </p>
            </SnapReveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {features.map((item, index) => {
                const Icon = item.icon;
                return (
                  <SnapReveal key={item.key} delay={0.12 + index * 0.07}>
                    <article className="glass-panel h-full rounded-[1.75rem] p-7">
                      <Icon className="h-7 w-7 text-brand-500" aria-hidden />
                      <h3 className="mt-5 text-xl font-semibold text-ink">
                        {t(`home.features.${item.key}.title`)}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                        {t(`home.features.${item.key}.text`)}
                      </p>
                    </article>
                  </SnapReveal>
                );
              })}
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="apps" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal>
              <StoreComingSoon animated />
            </SnapReveal>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection
          id="testimonials"
          activeId={activeId}
          className="border-t border-line/70"
        >
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal>
              <TestimonialsSection animated />
            </SnapReveal>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="blog" activeId={activeId} className="border-t border-line/70">
          <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
            <SnapReveal>
              <BlogPreview animated />
            </SnapReveal>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="cta" activeId={activeId} className="border-t border-line/70">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-between overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-5 flex flex-1 flex-col items-stretch justify-center gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
              <SnapReveal direction="left" className="max-w-xl">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {t('home.ctaTitle')}
                </h2>
                <p className="mt-4 text-base text-muted sm:text-lg">{t('home.ctaSubtitle')}</p>
              </SnapReveal>
              <SnapReveal direction="right" delay={0.12}>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  {isAuthenticated ? (
                    <Link to="/dashboard" className="w-full sm:w-auto">
                      <Button className="min-w-44 gap-2">
                        {t('nav.dashboard')}
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
              </SnapReveal>
            </div>
            <SnapReveal delay={0.18}>
              <SiteFooter compact embedded />
            </SnapReveal>
          </div>
        </AnimatedSnapSection>
      </div>
    </div>
  );
}
