import { Menu, X } from 'lucide-react';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/useAuth';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

const PAGE_LINKS = [
  { to: '/', labelKey: 'nav.home', match: (path: string) => path === '/' },
  { to: '/plans', labelKey: 'nav.plansShort', match: (path: string) => path === '/plans' },
  { to: '/guide', labelKey: 'nav.guide', match: (path: string) => path === '/guide' },
  { to: '/blog', labelKey: 'nav.blog', match: (path: string) => path === '/blog' || path.startsWith('/blog/') },
  { to: '/contact', labelKey: 'nav.contact', match: (path: string) => path === '/contact' },
] as const;

const DESKTOP_LINKS = PAGE_LINKS.filter((link) => link.to !== '/');

export function PublicDesktopNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="hidden items-center gap-1 xl:flex" aria-label={t('footer.linksLabel')}>
      {DESKTOP_LINKS.filter((link) => !link.match(pathname)).map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-xs font-semibold text-muted no-underline transition hover:bg-brand-50 hover:text-ink"
        >
          {t(link.labelKey)}
        </Link>
      ))}
    </nav>
  );
}

type PublicPageLinksProps = {
  onNavigate?: () => void;
};

export function PublicPageLinks({ onNavigate }: PublicPageLinksProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const row =
    'flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-semibold no-underline transition';
  const quiet = `${row} bg-brand-50/40 text-ink ring-1 ring-line/70 active:bg-brand-50`;
  const accent = `${row} justify-center bg-brand-500 text-[#07110d]`;

  const pages = PAGE_LINKS.filter((link) => !link.match(pathname) && link.to !== '/plans');
  const plans = PAGE_LINKS.find((link) => link.to === '/plans' && !link.match(pathname));

  return (
    <nav className="flex flex-col gap-2" aria-label={t('footer.linksLabel')}>
      {pages.map((link) => (
        <Link key={link.to} to={link.to} className={quiet} onClick={onNavigate}>
          {t(link.labelKey)}
        </Link>
      ))}
      {plans ? (
        <Link to={plans.to} className={`${accent} mt-1`} onClick={onNavigate}>
          {t(plans.labelKey)}
        </Link>
      ) : null}
      {isAuthenticated ? (
        <Link to="/dashboard" className={accent} onClick={onNavigate}>
          {t('nav.dashboard')}
        </Link>
      ) : (
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Link to="/login" className={`${quiet} justify-center`} onClick={onNavigate}>
            {t('nav.login')}
          </Link>
          <Link to="/register" className={accent} onClick={onNavigate}>
            {t('home.ctaRegister')}
          </Link>
        </div>
      )}
    </nav>
  );
}

type PublicMenuProps = {
  className?: string;
};

export function PublicMenu({ className = '' }: PublicMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  useLockBodyScroll(open);

  const close = () => setOpen(false);

  return (
    <div className={className}>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line/80 bg-panel text-ink transition hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-stretch justify-end bg-ink/45 backdrop-blur-[2px] md:items-start md:p-3"
              role="presentation"
              onClick={close}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="flex h-full w-full max-w-none flex-col bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:h-auto md:max-h-[calc(100dvh-1.5rem)] md:w-[min(22rem,calc(100vw-1.5rem))] md:rounded-[1.6rem] md:ring-1 md:ring-line"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 md:pt-4">
                  <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                    {t('nav.menu')}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-brand-50/50 text-ink transition active:bg-brand-50"
                    aria-label={t('nav.closeMenu')}
                    onClick={close}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <div className="overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-5">
                  <PublicPageLinks onNavigate={close} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
