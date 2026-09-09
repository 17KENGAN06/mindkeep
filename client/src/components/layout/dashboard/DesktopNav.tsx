import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavDropdown } from '@/components/layout/dashboard/NavDropdown';
import {
  filterNavForRole,
  isNavLinkActive,
  type DashboardNavEntry,
} from '@/config/dashboardNav';

const linkClass = (active: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active
      ? 'bg-brand-100 text-brand-500'
      : 'text-muted hover:bg-brand-50 hover:text-ink'
  }`;

type DesktopNavProps = {
  entries: DashboardNavEntry[];
  isAdmin: boolean;
};

export function DesktopNav({ entries, isAdmin }: DesktopNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const visible = filterNavForRole(entries, isAdmin);

  return (
    <nav className="hidden items-center gap-1 min-[1200px]:flex" aria-label="Main">
      {visible.map((entry) => {
        if (entry.type === 'link') {
          return (
            <NavLink
              key={entry.id}
              to={entry.to}
              end={entry.end}
              className={() => linkClass(isNavLinkActive(pathname, entry))}
            >
              {t(entry.labelKey)}
            </NavLink>
          );
        }

        return (
          <NavDropdown
            key={entry.id}
            group={entry}
            label={t(entry.labelKey)}
            getChildLabel={(labelKey) => t(labelKey)}
          />
        );
      })}
    </nav>
  );
}
