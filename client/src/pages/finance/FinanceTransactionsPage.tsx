import { useTranslation } from 'react-i18next';
import { PagePlaceholder } from '@/components/layout/dashboard/PagePlaceholder';

export function FinanceTransactionsPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t('placeholders.transactions.title')}
      description={t('placeholders.transactions.description')}
      note={t('placeholders.comingSoon')}
    />
  );
}
