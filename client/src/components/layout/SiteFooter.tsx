import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

const STUDIO_URL = 'https://weisezahoy.com/';
const STUDIO_NAME = 'WEISEZAHOY';
const INSTAGRAM_URL = 'https://www.instagram.com/mindkeep.cloud/';
const TIKTOK_URL = 'https://www.tiktok.com/@mindkeep.cloud';

function InstagramMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTokMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.44a2.89 2.89 0 0 1-5.76-.38 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15.05a6.34 6.34 0 0 0 6.33 6.33 6.34 6.34 0 0 0 6.33-6.33V8.73a8.18 8.18 0 0 0 4.77 1.52V6.8c-.34 0-.67-.04-1-.11Z" />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  handle,
  compact,
  icon,
}: {
  href: string;
  label: string;
  handle: string;
  compact: boolean;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`group inline-flex items-center gap-3 rounded-2xl bg-brand-50/50 ring-1 ring-line no-underline transition hover:bg-brand-50 hover:ring-brand-400 ${
        compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel text-brand-500 shadow-sm ring-1 ring-line transition group-hover:text-brand-400 group-hover:ring-brand-400">
        {icon}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-[11px] font-medium tracking-[0.18em] text-muted uppercase">{label}</span>
        <span className="mt-0.5 block text-sm font-semibold tracking-tight text-ink transition group-hover:text-brand-500">
          {handle}
        </span>
      </span>
    </a>
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

  const homeBar = compact && embedded;

  return (
    <footer
      className={`relative w-full ${
        homeBar
          ? 'mt-0 border-0 pt-0'
          : `border-t border-line ${compact ? 'pt-10 sm:pt-12' : 'pt-16 sm:pt-20'} ${
              embedded ? (compact ? 'mt-8 sm:mt-10' : 'mt-20 sm:mt-28') : ''
            }`
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/55 to-transparent"
      />

      <div
        className={
          embedded
            ? `flex w-full flex-col ${homeBar ? 'pb-1' : compact ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'}`
            : `mx-auto flex w-full max-w-[1400px] flex-col px-4 sm:px-6 lg:px-8 ${
                compact ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'
              }`
        }
      >
        <div
          className={`flex flex-col md:flex-row md:items-start md:justify-between ${
            homeBar ? 'gap-4 md:items-center md:gap-8' : 'gap-8 md:gap-12'
          }`}
        >
          <div className={homeBar ? 'min-w-0' : 'max-w-lg'}>
            <div className="flex items-center gap-2.5">
              <BrandMark className={`shrink-0 animate-float-slow ${homeBar ? 'h-7 w-7' : 'h-9 w-9'}`} />
              <p className="font-display text-lg font-semibold tracking-tight text-ink">
                {t('common.appName')}
              </p>
            </div>
            {homeBar ? null : (
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t('footer.tagline')}</p>
            )}
            {!compact ? (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{t('footer.about')}</p>
            ) : null}
            <div className={`flex flex-wrap gap-3 ${homeBar ? 'mt-3' : 'mt-5'}`}>
              <SocialLink
                href={INSTAGRAM_URL}
                label={t('footer.instagram')}
                handle={t('footer.instagramHandle')}
                compact={compact}
                icon={<InstagramMark className="h-[18px] w-[18px]" />}
              />
              <SocialLink
                href={TIKTOK_URL}
                label={t('footer.tiktok')}
                handle={t('footer.tiktokHandle')}
                compact={compact}
                icon={<TikTokMark className="h-[18px] w-[18px]" />}
              />
            </div>
          </div>

          <div className={homeBar ? 'min-w-0 md:text-right' : 'md:text-right'}>
            {homeBar ? null : (
              <p className="text-[11px] tracking-[0.24em] text-muted uppercase">{t('footer.linksLabel')}</p>
            )}
            <nav
              className={`flex flex-wrap gap-x-4 text-sm font-medium md:justify-end ${
                homeBar ? 'gap-y-1' : 'mt-3 gap-y-2.5'
              }`}
            >
              <Link
                to="/"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/guide"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('nav.guide')}
              </Link>
              <Link
                to="/blog"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('nav.blog')}
              </Link>
              <Link
                to="/login"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('nav.contact')}
              </Link>
              <Link
                to="/privacy"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('footer.privacy')}
              </Link>
              <a
                href={STUDIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center text-ink no-underline transition hover:text-brand-500 ${
                  homeBar ? 'min-h-8' : 'min-h-11 md:min-h-0'
                }`}
              >
                {t('footer.visitStudio')}
              </a>
            </nav>
          </div>
        </div>

        <div
          className={
            homeBar
              ? 'mt-4 border-t border-line/80 pt-3'
              : 'mt-12 border-t border-line/80 pt-8 sm:mt-16 sm:pt-12'
          }
        >
          <p className={`leading-relaxed text-muted ${homeBar ? 'text-xs' : 'text-sm sm:text-base'}`}>
            <Trans
              i18nKey="footer.ownership"
              values={{ year }}
              components={{ studio: studioLink }}
            />
          </p>
          {homeBar ? null : (
            <p className="mt-4 text-xs leading-relaxed text-muted/80">{t('footer.rights')}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
