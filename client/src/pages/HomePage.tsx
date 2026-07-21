import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-dvh bg-[linear-gradient(160deg,#eef8f3_0%,#f5f7f6_40%,#e7f1ec_100%)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
        <header className="mb-10 flex items-center justify-between">
          <p className="text-lg font-semibold text-brand-800">{t('common.appName')}</p>
          <LanguageSwitcher />
        </header>

        <section className="flex flex-1 flex-col justify-center gap-6 py-8">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t('home.title')}
          </h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">{t('home.subtitle')}</p>

          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button>{t('nav.dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button>{t('home.ctaRegister')}</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary">{t('home.ctaLogin')}</Button>
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
