import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        <header className="z-10 flex items-center justify-between gap-3">
          <BrandLockup to="/" size="lg" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          <section className="glass-panel w-full max-w-2xl rounded-[1.75rem] border border-line/70 p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <AlertTriangle className="h-7 w-7" aria-hidden />
            </div>

            <p className="text-xs font-semibold tracking-[0.2em] text-brand-500 uppercase">
              {t('maintenance.eyebrow')}
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t('maintenance.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {t('maintenance.subtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              {env.maintenanceMode && isAuthenticated && isAdmin ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button className="min-w-44">{t('nav.dashboard')}</Button>
                </Link>
              ) : null}

              {env.maintenanceMode ? (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="min-w-44">
                    {t('maintenance.adminLogin')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
