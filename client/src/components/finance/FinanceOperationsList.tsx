import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatSignedMoney } from '@/features/finance/financeUtils';
import type { FinanceOperation } from '@/types/finance';
import type { AppLanguage } from '@/i18n';

type FinanceOperationsListProps = {
  operations: FinanceOperation[];
  language: AppLanguage;
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

export function FinanceOperationsList({
  operations,
  language,
  onDelete,
  deletingId,
}: FinanceOperationsListProps) {
  const { t } = useTranslation();

  if (operations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-brand-50/40 px-4 py-10 text-center">
        <p className="text-sm font-medium text-ink">{t('finance.emptyOperations')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {operations.map((operation) => {
        const positive = operation.type === 'INCOME';
        const signed = positive ? operation.amount : -operation.amount;
        return (
          <li
            key={operation.id}
            className="flex flex-col gap-3 rounded-2xl bg-panel p-4 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                    positive ? 'bg-brand-100 text-brand-500' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {positive ? t('finance.income') : t('finance.expense')}
                </span>
                <span className="text-xs text-muted">
                  {new Date(operation.date).toLocaleDateString(language)}
                </span>
                {operation.category?.name ? (
                  <span className="text-xs text-muted">{operation.category.name}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-ink">
                {operation.comment || t('finance.noComment')}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p
                className={`text-base font-semibold ${positive ? 'text-brand-500' : 'text-red-400'}`}
                title={formatMoney(operation.amount, operation.currency, language)}
              >
                {formatSignedMoney(signed, operation.currency, language)}
              </p>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                aria-label={t('common.delete')}
                disabled={deletingId === operation.id}
                onClick={() => onDelete(operation.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
