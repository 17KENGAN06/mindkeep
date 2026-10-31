import { Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { DashboardSidebar } from '@/components/layout/dashboard/DashboardSidebar';
import { MobileNav } from '@/components/layout/dashboard/MobileNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Reveal } from '@/components/motion/Reveal';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { PlansCta } from '@/components/layout/PlansCta';
import { PAGE_SHELL_Y } from '@/config/layout';
import { dashboardNav } from '@/config/dashboardNav';
import { useAuth } from '@/features/auth/useAuth';

export function DashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="dash-shell flex min-h-dvh flex-col overflow-x-clip">
      <div aria-hidden className="dash-forest" />

      <div className={`dash-main ${PAGE_SHELL_Y} flex w-full flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-8 2xl:px-10`}>
        <header className="relative z-40 min-[1200px]:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandLockup to="/dashboard" size="sm" className="min-w-0" />
            <div className="flex shrink-0 items-center gap-2">
              <PlansCta />
              <NotificationBell />
              <MobileNav
                entries={dashboardNav}
                isAdmin={isAdmin}
                user={user}
                onLogout={() => void logout()}
              />
            </div>
          </div>
        </header>

        <Reveal key={location.pathname} trigger="mount" className="min-w-0 overflow-visible">
          <Outlet />
        </Reveal>

        <div className="mt-auto pt-4">
          <SiteFooter embedded compact />
        </div>
      </div>

      <DashboardSidebar
        entries={dashboardNav}
        isAdmin={isAdmin}
        user={user}
        onLogout={() => void logout()}
      />
    </div>
  );
}
