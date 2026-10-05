import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';
import { PaymentMarks } from '@/components/layout/PaymentMarks';
import { PAGE_SHELL } from '@/config/layout';
import { useAuth } from '@/features/auth/useAuth';

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
  /** Homepage snap section: no extra outer chrome, content only. */
  screen?: boolean;
};

export function SiteFooter({ compact = false, embedded = false, screen = false }: SiteFooterProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();
  const tight = compact || screen;

  const footerLinks = [
    { to: '/', label: t('nav.home'), match: (path: string) => path === '/' },
    { to: '/plans', label: t('nav.plansShort'), match: (path: string) => path === '/plans' },
    { to: '/guide', label: t('nav.guide'), match: (path: string) => path === '/guide' },
    { to: '/blog', label: t('nav.blog'), match: (path: string) => path === '/blog' || path.startsWith('/blog/') },
    { to: '/login', label: t('nav.login'), match: (path: string) => path === '/login' || isAuthenticated },
    { to: '/contact', label: t('nav.contact'), match: (path: string) => path === '/contact' },
  ].filter((link) => !link.match(location.pathname));

  const legalLinks = [
    { to: '/privacy', label: t('footer.privacy') },
    { to: '/terms', label: t('footer.terms') },
    { to: '/cookies', label: t('footer.cookies') },
    { to: '/refund', label: t('footer.refund') },
  ].filter((link) => link.to !== location.pathname);

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
      className={
        screen
          ? 'relative w-full'
          : `relative w-full border-t border-line ${
              tight ? 'pt-10 sm:pt-12' : 'pt-16 sm:pt-20'
            } ${embedded ? (tight ? 'mt-8 sm:mt-10' : 'mt-20 sm:mt-28') : ''}`
      }
    >
      {screen ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/55 to-transparent"
        />
      )}

      <div
        className={
          screen || embedded
            ? `flex w-full flex-col ${screen ? '' : tight ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'}`
            : `${PAGE_SHELL} flex flex-col ${tight ? 'pb-8 sm:pb-10' : 'pb-16 sm:pb-20'}`
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
            {tight ? null : (
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t('footer.tagline')}</p>
            )}
            {tight ? null : (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{t('footer.about')}</p>
            )}
            <div className={`${screen ? 'mt-6' : 'mt-5'} flex flex-wrap gap-3`}>
              <SocialLink
                href={INSTAGRAM_URL}
                label={t('footer.instagram')}
                handle={t('footer.instagramHandle')}
                compact={tight}
                icon={<InstagramMark className="h-[18px] w-[18px]" />}
              />
              <SocialLink
                href={TIKTOK_URL}
                label={t('footer.tiktok')}
                handle={t('footer.tiktokHandle')}
                compact={tight}
                icon={<TikTokMark className="h-[18px] w-[18px]" />}
              />
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-[11px] tracking-[0.24em] text-muted uppercase">{t('footer.linksLabel')}</p>
            <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2.5 text-sm font-medium md:max-w-md md:justify-end md:justify-self-end">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex min-h-11 items-center text-ink no-underline transition hover:text-brand-500 md:min-h-0"
                >
                  {link.label}
                </Link>
              ))}
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

        <div
          className={`${
            screen ? 'mt-10 pt-6 sm:mt-12 sm:pt-8' : 'mt-12 pt-8 sm:mt-16 sm:pt-12'
          } flex flex-col gap-6 border-t border-line/80 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10 sm:gap-y-5`}
        >
          <div className="min-w-0">
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              <Trans
                i18nKey="footer.ownership"
                values={{ year }}
                components={{ studio: studioLink }}
              />
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted/80">{t('footer.rights')}</p>
            <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex min-h-11 items-center text-muted no-underline transition hover:text-brand-500 md:min-h-0"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <PaymentMarks
            compact={compact}
            label={t('footer.paymentsLabel')}
            via={t('footer.paymentsVia')}
            ariaLabel={t('footer.paymentsAria')}
            stripeLabel={t('footer.paymentsStripe')}
          />
        </div>
      </div>
    </footer>
  );
}
