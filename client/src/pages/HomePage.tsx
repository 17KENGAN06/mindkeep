import { useState } from 'react';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatedSnapSection } from '@/components/home/AnimatedSnapSection';
import { HeroStage } from '@/components/home/HeroStage';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomePricing } from '@/components/home/HomePricing';
import { HomeServices } from '@/components/home/HomeServices';
import { SectionNav } from '@/components/home/SectionNav';
import { MobileHomeNav } from '@/components/home/MobileHomeNav';
import { SnapReveal } from '@/components/home/SnapReveal';
import { useSectionSnapScroll } from '@/components/home/useSectionSnapScroll';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { PAGE_SHELL, PAGE_SHELL_Y, HOME_SIDE_NAV_PAD } from '@/config/layout';

const SECTION_IDS = ['hero', 'services', 'pricing', 'footer'] as const;

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
    t('home.sections.footer'),
  ];

  return (
    <div className="home-snap-root relative min-h-dvh">
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
          className="fixed right-4 bottom-5 z-50 hidden h-11 w-11 items-center justify-center rounded-full border border-line/80 bg-panel/90 text-ink shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none md:inline-flex"
          aria-label={t('nav.home')}
          title={t('nav.home')}
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      <div
        ref={setScroller}
        className="home-snap min-h-dvh overflow-x-hidden"
        data-section-snap="true"
      >
        <AnimatedSnapSection id="hero" activeId={activeId}>
          <div className={`relative ${PAGE_SHELL} ${HOME_SIDE_NAV_PAD} ${PAGE_SHELL_Y} flex h-full w-full flex-col`}>
            <SnapReveal className="relative z-50" delay={0.02}>
              <PublicHeader size="lg" menuClassName="hidden md:block xl:hidden" />
            </SnapReveal>

            <div className="relative grid min-h-0 flex-1 items-start gap-6 pb-16 pt-5 md:gap-7 md:pb-12 md:pt-6 lg:grid-cols-2 lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] xl:items-center xl:gap-16 xl:pb-10 xl:pt-8">
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute inset-x-[-12%] top-[5%] -z-10 h-[60%] rounded-[45%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_70%)] xl:left-[-8%] xl:w-[70%]"
              />

              <div className="relative min-w-0">
                <SnapReveal direction="left" delay={0.08}>
                  <p className="font-display text-xs font-medium tracking-[0.28em] text-brand-500 uppercase sm:text-sm">
                    {t('home.eyebrow')}
                  </p>
                </SnapReveal>

                <SnapReveal direction="scale" delay={0.16}>
                  <h1 className="font-display mt-3 max-w-[16ch] text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-ink md:mt-4 md:text-[2.35rem] lg:text-[2.5rem] xl:mt-5 xl:max-w-5xl xl:text-[4.25rem]">
                    {t('home.title')}
                  </h1>
                </SnapReveal>

                <SnapReveal direction="right" delay={0.26}>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-base xl:mt-6 xl:max-w-3xl xl:text-xl">
                    {t('home.subtitle')}
                  </p>
                </SnapReveal>

                <SnapReveal delay={0.4}>
                  <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
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

              <SnapReveal direction="right" delay={0.28} className="min-w-0">
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

        <AnimatedSnapSection id="footer" activeId={activeId} className="border-t border-line/70">
          <HomeFooter />
        </AnimatedSnapSection>
      </div>
    </div>
  );
}
