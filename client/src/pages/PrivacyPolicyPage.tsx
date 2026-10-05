import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { MINDKEEP_CONTACT } from '@/config/contact';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const sections = t('privacy.sections', { returnObjects: true }) as Array<{
    title: string;
    body: string[];
  }>;

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-10 max-w-4xl">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">
            {t('privacy.eyebrow')}
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('privacy.title')}
          </h1>
          <p className="mt-4 text-sm text-muted sm:text-base">{t('privacy.updated')}</p>
          <p className="mt-5 text-base leading-relaxed text-ink/90 sm:text-lg">{t('privacy.intro')}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {Array.isArray(sections)
            ? sections.map((section, index) => (
                <Reveal
                  key={section.title}
                  delayMs={60 + index * 50}
                  className="glass-panel h-full rounded-2xl p-5 sm:p-6 lg:p-7"
                >
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
            <a href={`mailto:${MINDKEEP_CONTACT}`} className="font-medium text-brand-500 no-underline">
              {MINDKEEP_CONTACT}
            </a>
          </p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline">
            ← {t('nav.home')}
          </Link>
        </Reveal>
        <SiteFooter embedded />
      </div>
    </div>
  );
}
