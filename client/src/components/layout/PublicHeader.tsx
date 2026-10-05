import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { PlansCta } from '@/components/layout/PlansCta';
import { PublicDesktopNav, PublicMenu } from '@/components/layout/PublicPageMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

type PublicHeaderProps = {
  size?: 'sm' | 'md' | 'lg';
  brandClassName?: string;
  menuClassName?: string;
};

export function PublicHeader({
  size = 'md',
  brandClassName,
  menuClassName = 'xl:hidden',
}: PublicHeaderProps) {
  return (
    <header className="relative z-50 flex items-center justify-between gap-2 sm:gap-3">
      <BrandLockup to="/" size={size} className={brandClassName ?? 'min-w-0 max-w-[42%] sm:max-w-none'} />
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
        <PublicDesktopNav />
        <PlansCta />
        <ThemeToggle />
        <LanguageSwitcher />
        <PublicMenu className={menuClassName} />
      </div>
    </header>
  );
}
