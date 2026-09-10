import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  filterNavForRole,
  isNavGroupActive,
  isNavLinkActive,
  type DashboardNavEntry,
  type DashboardNavGroup,
} from '@/config/dashboardNav';

const linkClass = (active: boolean) =>
  `flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-medium no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active
      ? 'bg-brand-100 text-brand-500'
      : 'text-ink hover:bg-brand-50'
  }`;

type MobileNavProps = {
  entries: DashboardNavEntry[];
  isAdmin: boolean;
  onLogout: () => void;
};

function MobileAccordionGroup({
  group,
  getLabel,
  onNavigate,
}: {
  group: DashboardNavGroup;
  getLabel: (key: string) => string;
  onNavigate: () => void;
}) {
  const { pathname } = useLocation();
  const groupActive = isNavGroupActive(pathname, group);
  const [open, setOpen] = useState(groupActive);
  const panelId = useId();

  useEffect(() => {
    if (groupActive) {
      setOpen(true);
    }
  }, [groupActive, pathname]);

  return (
    <div className="rounded-2xl border border-line/60 bg-panel/60">
      <button
        type="button"
        className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          groupActive || open ? 'text-brand-500' : 'text-ink'
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{getLabel(group.labelKey)}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="space-y-1 border-t border-line/50 px-2 py-2">
          {group.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              end={child.end}
              className={() => linkClass(isNavLinkActive(pathname, child))}
              onClick={onNavigate}
            >
              {getLabel(child.labelKey)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MobileNav({ entries, isAdmin, onLogout }: MobileNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const visible = filterNavForRole(entries, isAdmin);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="min-[1200px]:hidden">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line/80 bg-panel text-ink transition hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open ? (
        <div
          id={panelId}
          className="fixed inset-0 z-[80] flex flex-col bg-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
            <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
              {t('nav.menu')}
            </h2>
            <button
              type="button"
              className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-2xl border border-line bg-brand-50/50 px-3 text-sm font-semibold text-ink"
              aria-label={t('nav.closeMenu')}
              onClick={close}
            >
              <X className="h-5 w-5" aria-hidden />
              <span>{t('nav.closeMenu')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <nav className="space-y-2" aria-label="Main">
              {visible.map((entry) => {
                if (entry.type === 'link') {
                  return (
                    <NavLink
                      key={entry.id}
                      to={entry.to}
                      end={entry.end}
                      className={() => linkClass(isNavLinkActive(pathname, entry))}
                      onClick={close}
                    >
                      {t(entry.labelKey)}
                    </NavLink>
                  );
                }

                return (
                  <MobileAccordionGroup
                    key={entry.id}
                    group={entry}
                    getLabel={(key) => t(key)}
                    onNavigate={close}
                  />
                );
              })}
            </nav>

            <div className="mt-6 space-y-3 border-t border-line/60 pt-5">
              <p className="text-xs tracking-[0.18em] text-muted uppercase">
                {t('nav.settings')}
              </p>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-brand-50/30 px-4 py-3">
                <span className="text-sm font-medium text-ink">{t('common.theme')}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-brand-50/30 px-4 py-3">
                <span className="text-sm font-medium text-ink">{t('common.language')}</span>
                <LanguageSwitcher />
              </div>
            </div>

            <button
              type="button"
              className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl border border-line text-base font-semibold text-muted transition active:bg-brand-50 active:text-ink"
              onClick={() => {
                close();
                onLogout();
              }}
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
