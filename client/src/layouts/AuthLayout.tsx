import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#d5f0e3_0%,_#f5f7f6_45%,_#eef2f0_100%)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-brand-800 no-underline">
            {t('common.appName')}
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-brand-100 backdrop-blur">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
