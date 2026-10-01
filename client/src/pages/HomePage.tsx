import { useState } from 'react';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { AnimatedSnapSection } from '@/components/home/AnimatedSnapSection';
import { HeroStage } from '@/components/home/HeroStage';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomePricing } from '@/components/home/HomePricing';
import { HomeServices } from '@/components/home/HomeServices';
import { SectionNav } from '@/components/home/SectionNav';
import { MobileHomeNav } from '@/components/home/MobileHomeNav';
import { SnapReveal } from '@/components/home/SnapReveal';
import { useSectionSnapScroll } from '@/components/home/useSectionSnapScroll';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const SECTION_IDS = ['hero', 'services', 'pricing', 'testimonials', 'footer'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const sectionIds = SECTION_IDS as unknown as string[];
  const { activeId, goToSection } = useSectionSnapScroll(sectionIds, scroller);

  const labels = [
    t('home.sections.hero'),
    t('home.sections.services'),
    t('home.sections.pricing'),
    t('home.sections.testimonials'),
    t('home.sections.footer'),
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
          className="fixed right-4 bottom-24 z-50 hidden h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel/90 text-ink shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none md:inline-flex xl:bottom-5"
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
          <div className="relative mx-auto flex h-full w-full max-w-[1400px] flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <SnapReveal
              className="relative z-50 flex items-center justify-between gap-2 sm:gap-3"
              delay={0.02}
            >
              <BrandLockup to="/" size="lg" className="min-w-0 max-w-[55%] sm:max-w-none" />
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <nav
                  className="hidden items-center gap-1 xl:flex"
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
                  <Link
                    to="/contact"
                    className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-xs font-semibold text-muted no-underline transition hover:bg-brand-50 hover:text-ink"
                  >
                    {t('nav.contact')}
                  </Link>
                </nav>
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </SnapReveal>

            <div className="relative grid min-h-0 flex-1 items-center gap-8 pb-24 pt-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] xl:gap-16 xl:pb-10 xl:pt-8">
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute inset-x-[-12%] top-[5%] -z-10 h-[60%] rounded-[45%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_70%)] xl:left-[-8%] xl:w-[70%]"
              />

              <div className="relative min-w-0">
                <SnapReveal direction="left" delay={0.08}>
                  <p className="font-display text-sm font-medium tracking-[0.28em] text-brand-500 uppercase">
                    {t('home.eyebrow')}
                  </p>
                </SnapReveal>

                <SnapReveal direction="scale" delay={0.16}>
                  <h1 className="font-display mt-4 max-w-5xl text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-ink sm:mt-5 sm:text-6xl lg:text-[3.4rem] xl:text-[4.25rem]">
                    {t('home.title')}
                  </h1>
                </SnapReveal>

                <SnapReveal direction="right" delay={0.26}>
                  <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg lg:text-xl">
                    {t('home.subtitle')}
                  </p>
                </SnapReveal>

                <SnapReveal delay={0.4}>
                  <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap">
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
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink no-underline sm:w-auto"
                    >
                      {t('nav.guide')}
                    </Link>
                  </div>
                </SnapReveal>
              </div>

              <SnapReveal direction="right" delay={0.28} className="min-w-0 xl:pr-10">
                <HeroStage />
              </SnapReveal>
            </div>
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="services" activeId={activeId} className="border-t border-line/70">
          <HomeServices />
        </AnimatedSnapSection>

        <AnimatedSnapSection id="pricing" activeId={activeId} className="border-t border-line/70">
          <HomePricing />
        </AnimatedSnapSection>

        <AnimatedSnapSection
          id="testimonials"
          activeId={activeId}
          className="border-t border-line/70"
        >
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:pr-28">
            <TestimonialsSection animated compact />
          </div>
        </AnimatedSnapSection>

        <AnimatedSnapSection id="footer" activeId={activeId} className="border-t border-line/70">
          <HomeFooter />
        </AnimatedSnapSection>
      </div>
    </div>
  );
}
