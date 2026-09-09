import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '@/components/layout/dashboard/PagePlaceholder';

export function TasksPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t('placeholders.tasks.title')}
      description={t('placeholders.tasks.description')}
      note={t('placeholders.comingSoon')}
    />
  );
}
