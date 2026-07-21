import { useTranslation } from 'react-i18next';

export function Loader() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-muted" role="status">
      {t('common.loading')}
    </div>
  );
}
