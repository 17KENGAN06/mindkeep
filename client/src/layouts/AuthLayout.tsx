import { Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';

export function AuthLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <BrandLockup to="/" size="md" />
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <Reveal key={location.pathname}>
          <main className="rounded-3xl border border-line bg-panel/90 p-5 shadow-sm backdrop-blur sm:p-6">
            <Outlet />
          </main>
        </Reveal>
      </div>

      <div className="mt-10 w-full sm:mt-14">
        <SiteFooter />
      </div>
    </div>
  );
}
