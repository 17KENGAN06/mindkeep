import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const sections = t('privacy.sections', { returnObjects: true }) as Array<{
    title: string;
    body: string[];
  }>;

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal className="mt-10">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('privacy.eyebrow')}
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('privacy.title')}
          </h1>
          <p className="mt-4 text-sm text-muted sm:text-base">{t('privacy.updated')}</p>
          <p className="mt-5 text-base leading-relaxed text-ink/90 sm:text-lg">{t('privacy.intro')}</p>
        </Reveal>

        <div className="mt-10 space-y-8">
          {Array.isArray(sections)
            ? sections.map((section, index) => (
                <Reveal key={section.title} delayMs={60 + index * 50} className="glass-panel rounded-2xl p-5 sm:p-6">
                  <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                  </div>
                </Reveal>
              ))
            : null}
        </div>

        <Reveal className="mt-10" delayMs={120}>
          <p className="text-sm text-muted">
            {t('privacy.contactLabel')}{' '}
            <a href="mailto:kengangenkay@gmail.com" className="font-medium text-brand-500 no-underline">
              kengangenkay@gmail.com
            </a>
          </p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline">
            ← {t('nav.home')}
          </Link>
        </Reveal>
      </div>
      <SiteFooter />
    </div>
  );
}
