import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

type GuideStep = {
  title: string;
  body: string;
};

type GuideFaq = {
  question: string;
  answer: string;
};

export function GuidePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const pillars = t('guide.pillars', { returnObjects: true }) as GuideStep[];
  const steps = t('guide.steps', { returnObjects: true }) as GuideStep[];
  const rules = t('guide.rules', { returnObjects: true }) as string[];
  const faq = t('guide.faq', { returnObjects: true }) as GuideFaq[];

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal className="mt-12 max-w-3xl sm:mt-16">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('guide.eyebrow')}
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('guide.title')}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t('guide.intro')}</p>
        </Reveal>

        <section className="mt-12 sm:mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {t('guide.pillarsTitle')}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.isArray(pillars)
              ? pillars.map((pillar, index) => (
                  <Reveal
                    key={pillar.title}
                    delayMs={60 + index * 40}
                    className="glass-panel h-full rounded-2xl p-5 sm:p-6"
                  >
                    <h3 className="text-xl font-semibold text-ink">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{pillar.body}</p>
                  </Reveal>
                ))
              : null}
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {t('guide.stepsTitle')}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.isArray(steps)
              ? steps.map((step, index) => (
                  <Reveal
                    key={step.title}
                    delayMs={60 + index * 45}
                    className="glass-panel h-full rounded-2xl p-5 sm:p-6"
                  >
                    <p className="font-display text-xs tracking-[0.2em] text-brand-500 uppercase">
                      {t('guide.stepLabel', { number: index + 1 })}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-ink">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{step.body}</p>
                  </Reveal>
                ))
              : null}
          </div>
        </section>

        <Reveal className="mt-12 glass-panel rounded-3xl p-6 sm:mt-16 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-ink">{t('guide.rulesTitle')}</h2>
          <ul className="mt-5 space-y-3">
            {Array.isArray(rules)
              ? rules.map((rule) => (
                  <li key={rule} className="flex gap-3 text-sm leading-relaxed text-muted sm:text-base">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    <span>{rule}</span>
                  </li>
                ))
              : null}
          </ul>
        </Reveal>

        <section className="mt-12 sm:mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {t('guide.faqTitle')}
          </h2>
          <div className="mt-6 space-y-3">
            {Array.isArray(faq)
              ? faq.map((item, index) => (
                  <Reveal
                    key={item.question}
                    delayMs={60 + index * 40}
                    className="rounded-2xl border border-line bg-panel/75 p-5"
                  >
                    <h3 className="font-semibold text-ink">{item.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{item.answer}</p>
                  </Reveal>
                ))
              : null}
          </div>
        </section>

        <Reveal className="my-12 rounded-3xl bg-brand-100 p-6 sm:my-16 sm:p-8" delayMs={120}>
          <h2 className="font-display text-2xl font-semibold text-ink">{t('guide.ctaTitle')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t('guide.ctaSubtitle')}
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="mt-6 inline-flex no-underline"
          >
            <Button>{t(isAuthenticated ? 'guide.ctaUser' : 'guide.ctaGuest')}</Button>
          </Link>
        </Reveal>
      </div>
      <SiteFooter />
    </div>
  );
}
