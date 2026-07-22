import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';

const STUDIO_URL = 'https://weisezahoy.com/';
const STUDIO_NAME = 'WEISEZAHOY';

type SiteFooterProps = {
  compact?: boolean;
};

export function SiteFooter({ compact = false }: SiteFooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const studioLink = (
    <a
      href={STUDIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-display font-semibold tracking-[0.14em] text-brand-500 no-underline transition hover:text-brand-400"
    >
      {STUDIO_NAME}
    </a>
  );

  return (
    <footer className="relative w-full border-t border-line pt-12 sm:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/55 to-transparent"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 sm:px-6 sm:pb-14">
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
