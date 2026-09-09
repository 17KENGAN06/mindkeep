import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  filterNavForRole,
  isNavGroupActive,
  isNavLinkActive,
  type DashboardNavEntry,
  type DashboardNavGroup,
} from '@/config/dashboardNav';

const linkClass = (active: boolean) =>
  `flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active
      ? 'bg-brand-100 text-brand-500'
      : 'text-muted hover:bg-brand-50 hover:text-ink'
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
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          groupActive || open ? 'text-brand-500' : 'text-muted'
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{getLabel(group.labelKey)}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="min-[1200px]:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line/80 bg-panel text-ink transition hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
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
          className="absolute inset-x-0 top-full z-50 mt-3 max-h-[min(70dvh,32rem)] overflow-y-auto rounded-2xl border border-line/80 bg-panel p-3 shadow-lg shadow-black/25"
        >
          <nav className="space-y-2" aria-label="Main">
            {visible.map((entry) => {
              if (entry.type === 'link') {
                return (
                  <NavLink
                    key={entry.id}
                    to={entry.to}
                    end={entry.end}
                    className={() => linkClass(isNavLinkActive(pathname, entry))}
                    onClick={() => setOpen(false)}
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
                  onNavigate={() => setOpen(false)}
                />
              );
            })}
          </nav>

          <div className="mt-3 border-t border-line/60 pt-3">
            <button
              type="button"
              className={linkClass(false) + ' w-full'}
              onClick={() => {
                setOpen(false);
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
