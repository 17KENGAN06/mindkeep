import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

const STUDIO_URL = 'https://weisezahoy.com/';
const STUDIO_NAME = 'WEISEZAHOY';
const INSTAGRAM_URL = 'https://www.instagram.com/mindkeep.cloud/';

function InstagramMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

type SiteFooterProps = {
  compact?: boolean;
  /** Fill parent width — use when footer sits inside the same container as the header. */
  embedded?: boolean;
};

export function SiteFooter({ compact = false, embedded = false }: SiteFooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const studioLink = (
    <a
      href={STUDIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-display ml-1.5 inline-flex font-semibold tracking-[0.14em] text-brand-500 no-underline transition hover:text-brand-400"
    >
      {STUDIO_NAME}
    </a>
  );

  return (
    <footer
      className={`relative w-full border-t border-line ${
        compact ? 'pt-10 sm:pt-12' : 'pt-16 sm:pt-20'
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/55 to-transparent"
      />

      <div
        className={
          embedded
            ? `flex w-full flex-col ${compact ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'}`
            : `mx-auto flex w-full max-w-[1400px] flex-col px-4 sm:px-6 lg:px-8 ${
                compact ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'
              }`
        }
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="max-w-lg">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9 shrink-0 animate-float-slow" />
              <p className="font-display text-lg font-semibold tracking-tight text-ink">
                {t('common.appName')}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t('footer.tagline')}</p>
            {!compact ? (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{t('footer.about')}</p>
            ) : null}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.instagram')}
              className={`group mt-5 inline-flex items-center gap-3 rounded-2xl bg-brand-50/50 ring-1 ring-line no-underline transition hover:bg-brand-50 hover:ring-brand-400 ${
                compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel text-brand-500 shadow-sm ring-1 ring-line transition group-hover:text-brand-400 group-hover:ring-brand-400">
                <InstagramMark className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
                  {t('footer.follow')}
                </span>
                <span className="mt-0.5 block text-sm font-semibold tracking-tight text-ink transition group-hover:text-brand-500">
                  {t('footer.instagramHandle')}
                </span>
              </span>
            </a>
          </div>

          <div className="md:text-right">
            <p className="text-[11px] tracking-[0.24em] text-muted uppercase">{t('footer.linksLabel')}</p>
            <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2.5 text-sm font-medium md:justify-end">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/guide"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('nav.guide')}
              </Link>
              <Link
                to="/blog"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('nav.blog')}
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('nav.contact')}
              </Link>
              <Link
                to="/privacy"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('footer.privacy')}
              </Link>
              <a
                href={STUDIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
              >
                {t('footer.visitStudio')}
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-line/80 pt-8 sm:mt-16 sm:pt-12">
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            <Trans
              i18nKey="footer.ownership"
              values={{ year }}
              components={{ studio: studioLink }}
            />
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted/80">{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
