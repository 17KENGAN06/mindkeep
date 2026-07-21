import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-100 text-brand-800' : 'text-muted hover:bg-brand-50 hover:text-ink'
  }`;

export function DashboardLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand-700">{t('common.appName')}</p>
            <nav className="mt-2 flex flex-wrap gap-1" aria-label="Main">
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
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <Button variant="secondary" type="button" onClick={() => void logout()}>
              {t('nav.logout')}
            </Button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
