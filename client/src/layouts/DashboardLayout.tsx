import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { DesktopNav } from '@/components/layout/dashboard/DesktopNav';
import { MobileNav } from '@/components/layout/dashboard/MobileNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/Button';
import { PAGE_SHELL, PAGE_SHELL_Y } from '@/config/layout';
import { dashboardNav } from '@/config/dashboardNav';
import { useAuth } from '@/features/auth/useAuth';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className={`${PAGE_SHELL} ${PAGE_SHELL_Y} flex flex-1 flex-col gap-6`}>
        <header className="relative z-40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLockup to="/dashboard" size="sm" className="min-w-0" />
              <DesktopNav entries={dashboardNav} isAdmin={isAdmin} user={user} />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <div className="hidden items-center gap-2 min-[1200px]:flex">
                <Button variant="secondary" type="button" onClick={() => void logout()}>
                  {t('nav.logout')}
                </Button>
              </div>
              <MobileNav
                entries={dashboardNav}
                isAdmin={isAdmin}
                user={user}
                onLogout={() => void logout()}
              />
            </div>
          </div>
        </header>

        <Reveal key={location.pathname} trigger="mount">
          <Outlet />
        </Reveal>

        <div className="mt-auto pt-4">
          <SiteFooter embedded compact />
        </div>
      </div>
    </div>
  );
}
