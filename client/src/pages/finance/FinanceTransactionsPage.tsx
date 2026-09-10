import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FinanceOperationsList } from '@/components/finance/FinanceOperationsList';
import { FinancePeriodControls } from '@/components/finance/FinancePeriodControls';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { currentPeriodDefaults } from '@/features/finance/financeUtils';
import {
  useDeleteFinanceOperation,
  useFinanceSummary,
} from '@/features/finance/useFinance';
import type { AppLanguage } from '@/i18n';
import type { FinanceOperationType, FinanceView } from '@/types/finance';

export function FinanceTransactionsPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const defaults = currentPeriodDefaults();

  const [view, setView] = useState<FinanceView>(defaults.view);
  const [year, setYear] = useState(defaults.year);
  const [month, setMonth] = useState(defaults.month);
  const [typeFilter, setTypeFilter] = useState<'ALL' | FinanceOperationType>('ALL');
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const summaryQuery = useFinanceSummary({
    view,
    year,
    ...(view === 'month' ? { month } : {}),
  });
  const deleteOperation = useDeleteFinanceOperation();

  if (summaryQuery.isLoading) {
    return <Loader />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const summary = summaryQuery.data;
  const operations =
    typeFilter === 'ALL'
      ? summary.operations
      : summary.operations.filter((item) => item.type === typeFilter);

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setFormError(null);
    try {
      await deleteOperation.mutateAsync(id);
    } catch {
      setFormError(t('auth.errors.generic'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('finance.transactionsTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('finance.transactionsSubtitle')}</p>
      </section>

      <FinancePeriodControls
        view={view}
        year={year}
        month={month}
        onViewChange={setView}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      <div className="max-w-xs">
        <Select
          label={t('finance.typeFilter')}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as 'ALL' | FinanceOperationType)}
          options={[
            { value: 'ALL', label: t('finance.allTypes') },
            { value: 'INCOME', label: t('finance.income') },
            { value: 'EXPENSE', label: t('finance.expense') },
          ]}
        />
      </div>

      <ErrorMessage message={formError ?? undefined} />

      <FinanceOperationsList
        operations={operations}
        language={language}
        onDelete={(id) => void onDelete(id)}
        deletingId={deletingId}
      />
    </div>
  );
}
