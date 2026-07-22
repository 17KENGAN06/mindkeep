import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition touch-manipulation ${
    isActive
      ? 'bg-brand-100 text-brand-500'
      : 'text-muted hover:bg-brand-50 hover:text-ink'
  }`;

export function DashboardLayout() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-5 sm:py-6">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLockup to="/dashboard" size="sm" />
            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <LanguageSwitcher />
              <Button variant="secondary" type="button" onClick={() => void logout()}>
                {t('nav.logout')}
              </Button>
            </div>
          </div>
          <nav
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            aria-label="Main"
          >
            <NavLink to="/dashboard" className={linkClass} end>
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/review" className={linkClass}>
              {t('nav.review')}
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              {t('nav.calendar')}
            </NavLink>
            <NavLink to="/materials" className={linkClass}>
              {t('nav.materials')}
            </NavLink>
            <NavLink to="/categories" className={linkClass}>
              {t('nav.categories')}
            </NavLink>
            <NavLink to="/notifications" className={linkClass}>
              {t('nav.notifications')}
            </NavLink>
            <NavLink to="/statistics" className={linkClass}>
              {t('nav.statistics')}
            </NavLink>
            <NavLink to="/guide" className={linkClass}>
              {t('nav.guide')}
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className={linkClass}>
                {t('nav.admin')}
              </NavLink>
            ) : null}
          </nav>
        </header>

        <Reveal key={location.pathname}>
          <Outlet />
        </Reveal>
      </div>

      <div className="mt-8 w-full sm:mt-10">
        <SiteFooter compact />
      </div>
    </div>
  );
}
