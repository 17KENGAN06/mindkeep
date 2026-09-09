import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { DesktopNav } from '@/components/layout/dashboard/DesktopNav';
import { MobileNav } from '@/components/layout/dashboard/MobileNav';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';
import { dashboardNav } from '@/config/dashboardNav';
import { useAuth } from '@/features/auth/useAuth';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="relative z-40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLockup to="/dashboard" size="sm" />
              <DesktopNav entries={dashboardNav} isAdmin={isAdmin} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <LanguageSwitcher />
              <Button
                variant="secondary"
                type="button"
                className="hidden min-[1200px]:inline-flex"
                onClick={() => void logout()}
              >
                {t('nav.logout')}
              </Button>
              <MobileNav
                entries={dashboardNav}
                isAdmin={isAdmin}
                onLogout={() => void logout()}
              />
            </div>
          </div>
        </header>

        <Reveal key={location.pathname} trigger="mount">
          <Outlet />
        </Reveal>
      </div>

      <div className="mt-8 w-full sm:mt-10">
        <SiteFooter compact />
      </div>
    </div>
  );
}
