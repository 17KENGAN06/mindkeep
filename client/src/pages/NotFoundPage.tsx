import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLockup to="/" size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <Reveal>
            <p className="font-display text-xs tracking-[0.28em] text-brand-500 uppercase">
              {t('notFound.eyebrow')}
            </p>
            <p className="font-display mt-4 text-7xl font-semibold tracking-tight text-ink sm:text-8xl">
              404
            </p>
            <h1 className="font-display mt-4 text-2xl font-semibold text-ink sm:text-3xl">
              {t('notFound.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              {t('notFound.subtitle')}
            </p>
          </Reveal>

          <Reveal className="mt-8 flex w-full justify-center sm:w-auto" delayMs={100}>
            <Link to="/" className="w-full sm:w-auto">
              <Button className="min-w-40">{t('notFound.home')}</Button>
            </Link>
          </Reveal>
        </div>

        <SiteFooter compact />
      </div>
    </div>
  );
}
