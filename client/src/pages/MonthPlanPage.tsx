import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '@/components/layout/dashboard/PagePlaceholder';

export function MonthPlanPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t('placeholders.monthPlan.title')}
      description={t('placeholders.monthPlan.description')}
      note={t('placeholders.comingSoon')}
    />
  );
}
