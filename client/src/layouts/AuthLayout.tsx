import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-ink no-underline"
          >
            {t('common.appName')}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="rounded-3xl border border-line bg-panel/90 p-6 shadow-sm backdrop-blur">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
