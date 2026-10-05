import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { PlansCta } from '@/components/layout/PlansCta';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

type PublicHeaderProps = {
  size?: 'sm' | 'md' | 'lg';
  brandClassName?: string;
};

export function PublicHeader({ size = 'md', brandClassName }: PublicHeaderProps) {
  return (
    <header className="relative z-50 flex items-center justify-between gap-2 sm:gap-3">
      <BrandLockup to="/" size={size} className={brandClassName ?? 'min-w-0 max-w-[48%] sm:max-w-none'} />
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <PlansCta />
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
