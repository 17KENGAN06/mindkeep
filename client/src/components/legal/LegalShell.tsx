import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { MINDKEEP_ADMIN, MINDKEEP_CONTACT } from '@/config/contact';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';

export type LegalDoc = 'privacy' | 'terms' | 'cookies' | 'refund';

const CONTACT: Record<LegalDoc, string> = {
  privacy: MINDKEEP_CONTACT,
  terms: MINDKEEP_CONTACT,
  cookies: MINDKEEP_CONTACT,
  refund: MINDKEEP_ADMIN,
};

const DOCS: LegalDoc[] = ['privacy', 'terms', 'cookies', 'refund'];

export function LegalShell({ doc }: { doc: LegalDoc }) {
  const { t } = useTranslation();
  const sections = t(`${doc}.sections`, { returnObjects: true }) as Array<{
    title: string;
    body: string[];
  }>;
  const email = CONTACT[doc];

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y}`}>
        <PublicHeader />

        <Reveal className="mt-10 max-w-4xl">
          <p className="font-display text-xs tracking-[0.24em] text-brand-500 uppercase">{t(`${doc}.eyebrow`)}</p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t(`${doc}.title`)}
          </h1>
          <p className="mt-4 text-sm text-muted sm:text-base">{t(`${doc}.updated`)}</p>
          <p className="mt-5 text-base leading-relaxed text-ink/90 sm:text-lg">{t(`${doc}.intro`)}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {Array.isArray(sections)
            ? sections.map((section, index) => (
                <Reveal
                  key={section.title}
                  delayMs={60 + index * 40}
                  className="glass-panel h-full rounded-2xl p-5 sm:p-6 lg:p-7"
                >
                  <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{section.title}</h2>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                </Reveal>
              ))
            : null}
        </div>

        <Reveal className="mt-10" delayMs={120}>
          <p className="text-sm text-muted">
            {t(`${doc}.contactLabel`)}{' '}
            <a href={`mailto:${email}`} className="font-medium text-brand-500 no-underline">
              {email}
            </a>
          </p>
          {doc === 'refund' ? (
            <Link
              to="/contact?topic=billing"
              className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline"
            >
              {t('refund.requestCta')}
            </Link>
          ) : null}
          <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            {DOCS.filter((item) => item !== doc).map((item) => (
              <Link key={item} to={`/${item}`} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-brand-500">
                {t(`footer.${item}`)}
              </Link>
            ))}
          </nav>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-500 no-underline">
            ← {t('nav.home')}
          </Link>
        </Reveal>
        <SiteFooter embedded />
      </div>
    </div>
  );
}
