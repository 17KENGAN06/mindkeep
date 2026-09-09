import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '@/components/layout/dashboard/PagePlaceholder';

export function FinanceBudgetPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t('placeholders.budget.title')}
      description={t('placeholders.budget.description')}
      note={t('placeholders.comingSoon')}
    />
  );
}
