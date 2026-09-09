import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '@/components/layout/dashboard/PagePlaceholder';

export function FinanceCategoriesPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t('placeholders.expenseCategories.title')}
      description={t('placeholders.expenseCategories.description')}
      note={t('placeholders.comingSoon')}
    />
  );
}
