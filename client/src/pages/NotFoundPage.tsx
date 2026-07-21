import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold text-ink">404</h1>
      <Link to="/">
        <Button>{t('nav.home')}</Button>
      </Link>
    </div>
  );
}
