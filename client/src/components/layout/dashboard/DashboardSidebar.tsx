import {
  CalendarCheck,
  ChevronDown,
  Ellipsis,
  GraduationCap,
  House,
  LogOut,
  NotebookPen,
  Repeat,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { PlansCta } from '@/components/layout/PlansCta';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  filterNavForModules,
  filterNavForRole,
  isNavGroupActive,
  isNavLinkActive,
  type DashboardNavEntry,
  type DashboardNavGroup,
} from '@/config/dashboardNav';
import { firstName } from '@/utils/name';

const ENTRY_ICONS: Record<string, LucideIcon> = {
  dashboard: House,
  notes: NotebookPen,
  nutrition: Utensils,
  rhythm: Repeat,
  planning: CalendarCheck,
  repetition: GraduationCap,
  finance: Wallet,
  more: Ellipsis,
};

const rowClass = (active: boolean) =>
  `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active ? 'bg-brand-500/15 text-brand-500' : 'text-muted hover:bg-brand-500/[0.08] hover:text-ink'
  }`;

const childClass = (active: boolean) =>
  `flex min-h-9 items-center rounded-lg px-3 text-[13px] font-medium no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active ? 'bg-brand-500/15 text-brand-500' : 'text-muted hover:bg-brand-500/[0.08] hover:text-ink'
  }`;

function SidebarGroup({ group, getLabel }: { group: DashboardNavGroup; getLabel: (key: string) => string }) {
  const { pathname } = useLocation();
  const groupActive = isNavGroupActive(pathname, group);
  const [open, setOpen] = useState(groupActive);
  const panelId = useId();
  const Icon = ENTRY_ICONS[group.id] ?? Ellipsis;

  // Expand the group again when navigating to one of its pages (adjusted during render).
  const [seenFor, setSeenFor] = useState({ groupActive, pathname });
  if (seenFor.groupActive !== groupActive || seenFor.pathname !== pathname) {
    setSeenFor({ groupActive, pathname });
    if (groupActive) setOpen(true);
  }

  return (
    <div>
      <button
        type="button"
        className={rowClass(groupActive && !open)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{getLabel(group.labelKey)}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="mt-1 ml-[1.35rem] space-y-0.5 border-l border-line/60 pl-2">
          {group.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              end={child.end}
              className={() => childClass(isNavLinkActive(pathname, child))}
            >
              {getLabel(child.labelKey)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type DashboardSidebarProps = {
  entries: DashboardNavEntry[];
  isAdmin: boolean;
  user: { name?: string | null; onboardingCompleted?: boolean; enabledModules?: string[] } | null;
  onLogout: () => void;
};

/** Desktop navigation: full-height panel on the right, on every page of the dashboard. */
export function DashboardSidebar({ entries, isAdmin, user, onLogout }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const visible = filterNavForModules(filterNavForRole(entries, isAdmin), user);
  const name = firstName(user?.name);

  return (
    <aside className="dash-sidebar fixed inset-y-0 right-0 z-30 hidden w-[var(--dash-sidebar)] flex-col min-[1200px]:flex">
      <div className="px-5 pt-5 pb-4">
        <BrandLockup to="/dashboard" size="md" />
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3" aria-label="Main">
        {visible.map((entry) => {
          if (entry.type === 'group') {
            return <SidebarGroup key={entry.id} group={entry} getLabel={(key) => t(key)} />;
          }
          const Icon = ENTRY_ICONS[entry.id] ?? Ellipsis;
          return (
            <NavLink
              key={entry.id}
              to={entry.to}
              end={entry.end}
              className={() => rowClass(isNavLinkActive(pathname, entry))}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{t(entry.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line/50 px-4 py-4">
        <PlansCta className="w-full" />
        <div className="flex items-center gap-1">
          <NotificationBell panelSide="left" />
          <Link
            to="/account"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-sm font-medium text-ink no-underline transition hover:bg-brand-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-500 uppercase"
            >
              {name.charAt(0)}
            </span>
            <span className="min-w-0 truncate">{name || t('nav.account')}</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-brand-500/[0.08] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
