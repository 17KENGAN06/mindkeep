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

type PublicPageLinksProps = {
  onNavigate?: () => void;
};

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

export function PublicPageLinks({ onNavigate }: PublicPageLinksProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const tile =
    'inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-50/40 px-3 text-sm font-semibold text-ink no-underline ring-1 ring-line/70';
  const primary =
    'inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-500 px-3 text-sm font-semibold text-[#07110d] no-underline';

  return (
    <div className="grid grid-cols-2 gap-2">
      {PAGE_LINKS.filter((link) => !link.match(pathname)).map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={
            link.to === '/plans' ? `col-span-2 ${primary}` : link.to === '/' ? `col-span-2 ${tile}` : tile
          }
          onClick={onNavigate}
        >
          {t(link.labelKey)}
        </Link>
      ))}
      {isAuthenticated ? (
        <Link to="/dashboard" className={`col-span-2 ${primary}`} onClick={onNavigate}>
          {t('nav.dashboard')}
        </Link>
      ) : (
        <>
          <Link to="/login" className={tile} onClick={onNavigate}>
            {t('nav.login')}
          </Link>
          <Link to="/register" className={primary} onClick={onNavigate}>
            {t('home.ctaRegister')}
          </Link>
        </>
      )}
    </div>
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
              className="fixed inset-0 z-[80] flex flex-col bg-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium tracking-[0.18em] text-muted uppercase">
                    {t('home.mobileNav.pages')}
                  </p>
                  <h2 id={titleId} className="font-display truncate text-xl font-semibold text-ink">
                    {t('nav.menu')}
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-2xl border border-line bg-brand-50/50 px-3 text-sm font-semibold text-ink transition active:bg-brand-50"
                  aria-label={t('nav.closeMenu')}
                  onClick={close}
                >
                  <X className="h-5 w-5" aria-hidden />
                  <span>{t('nav.closeMenu')}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <PublicPageLinks onNavigate={close} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
