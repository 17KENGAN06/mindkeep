import type { AppModule } from '@/config/appModules';
import { userHasModule } from '@/config/appModules';

export type DashboardNavLink = {
  type: 'link';
  id: string;
  labelKey: string;
  to: string;
  end?: boolean;
  adminOnly?: boolean;
  module?: AppModule;
  /** Paths that mark this link (and its parent group) as active */
  matchPrefixes?: string[];
};

export type DashboardNavGroup = {
  type: 'group';
  id: string;
  labelKey: string;
  children: DashboardNavLink[];
};

export type DashboardNavEntry = DashboardNavLink | DashboardNavGroup;

export const dashboardNav: DashboardNavEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    to: '/dashboard',
    end: true,
  },
  {
    type: 'link',
    id: 'notes',
    labelKey: 'nav.notes',
    to: '/notes',
    module: 'notes',
    matchPrefixes: ['/notes'],
  },
  {
    type: 'link',
    id: 'nutrition',
    labelKey: 'nav.nutrition',
    to: '/nutrition',
    module: 'nutrition',
    matchPrefixes: ['/nutrition', '/calories'],
  },
  {
    type: 'link',
    id: 'rhythm',
    labelKey: 'nav.rhythm',
    to: '/habits',
    module: 'habits',
    matchPrefixes: ['/habits', '/rhythm'],
  },
  {
    type: 'group',
    id: 'planning',
    labelKey: 'nav.planning',
    children: [
      {
        type: 'link',
        id: 'tasks',
        labelKey: 'nav.tasks',
        to: '/tasks',
        module: 'tasks',
      },
      {
        type: 'link',
        id: 'month-plan',
        labelKey: 'nav.monthPlan',
        to: '/month-plan',
        module: 'tasks',
      },
    ],
  },
  {
    type: 'group',
    id: 'repetition',
    labelKey: 'nav.repetition',
    children: [
      {
        type: 'link',
        id: 'review',
        labelKey: 'nav.review',
        to: '/review',
        module: 'review',
      },
      {
        type: 'link',
        id: 'calendar',
        labelKey: 'nav.reviewCalendar',
        to: '/calendar',
        module: 'review',
      },
      {
        type: 'link',
        id: 'materials',
        labelKey: 'nav.materials',
        to: '/materials',
        module: 'review',
        matchPrefixes: ['/materials'],
      },
      {
        type: 'link',
        id: 'categories',
        labelKey: 'nav.categories',
        to: '/categories',
        module: 'review',
      },
    ],
  },
  {
    type: 'group',
    id: 'finance',
    labelKey: 'nav.finance',
    children: [
      {
        type: 'link',
        id: 'budget',
        labelKey: 'nav.budget',
        to: '/finance',
        module: 'finance',
        end: true,
      },
      {
        type: 'link',
        id: 'transactions',
        labelKey: 'nav.transactions',
        to: '/finance/transactions',
        module: 'finance',
      },
      {
        type: 'link',
        id: 'expense-categories',
        labelKey: 'nav.expenseCategories',
        to: '/finance/categories',
        module: 'finance',
      },
    ],
  },
  {
    type: 'group',
    id: 'more',
    labelKey: 'nav.more',
    children: [
      {
        type: 'link',
        id: 'settings',
        labelKey: 'nav.settings',
        to: '/settings',
      },
      {
        type: 'link',
        id: 'account',
        labelKey: 'nav.account',
        to: '/account',
      },
      {
        type: 'link',
        id: 'guide',
        labelKey: 'nav.guide',
        to: '/guide',
      },
      {
        type: 'link',
        id: 'contact',
        labelKey: 'nav.contact',
        to: '/contact',
      },
      {
        type: 'link',
        id: 'admin',
        labelKey: 'nav.admin',
        to: '/admin',
        adminOnly: true,
      },
    ],
  },
];

export function isNavLinkActive(pathname: string, item: DashboardNavLink): boolean {
  if (item.matchPrefixes?.length) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }

  if (item.end) {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isNavGroupActive(pathname: string, group: DashboardNavGroup): boolean {
  return group.children.some((child) => isNavLinkActive(pathname, child));
}

export function filterNavForRole(
  entries: DashboardNavEntry[],
  isAdmin: boolean,
): DashboardNavEntry[] {
  return entries
    .map((entry) => {
      if (entry.type === 'link') {
        if (entry.adminOnly && !isAdmin) return null;
        return entry;
      }

      const children = entry.children.filter((child) => !child.adminOnly || isAdmin);
      if (children.length === 0) return null;
      return { ...entry, children };
    })
    .filter((entry): entry is DashboardNavEntry => entry !== null);
}

export function filterNavForModules(
  entries: DashboardNavEntry[],
  user: { onboardingCompleted?: boolean; enabledModules?: string[] } | null,
): DashboardNavEntry[] {
  return entries
    .map((entry) => {
      if (entry.type === 'link') {
        if (entry.module && !userHasModule(user, entry.module)) return null;
        return entry;
      }

      const children = entry.children.filter(
        (child) => !child.module || userHasModule(user, child.module),
      );
      if (children.length === 0) return null;
      return { ...entry, children };
    })
    .filter((entry): entry is DashboardNavEntry => entry !== null);
}
