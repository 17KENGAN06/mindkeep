import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Textarea } from '@/components/ui/Textarea';
import type { FinanceCurrency } from '@/features/finance/currencies';
import { formatSignedMoney } from '@/features/finance/financeUtils';
import {
  parseFinanceImport,
  type FinanceDraftOperation,
} from '@/features/finance/parseFinanceImport';
import type { AppLanguage } from '@/i18n';
import type { FinanceCategory } from '@/types/finance';

type FinanceImportDialogProps = {
  open: boolean;
  language: AppLanguage;
  fallbackCurrency: FinanceCurrency;
  categories: FinanceCategory[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onImport: (operations: FinanceDraftOperation[]) => void;
};

export function FinanceImportDialog({
  open,
  language,
  fallbackCurrency,
  categories,
  isLoading = false,
  error,
  onClose,
  onImport,
}: FinanceImportDialogProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open) return;
    setText('');
  }, [open]);

  const parsed = useMemo(() => parseFinanceImport(text, fallbackCurrency), [text, fallbackCurrency]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-import-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (parsed.rows.length === 0 || isLoading) return;
          onImport(parsed.rows);
        }}
      >
        <div className="shrink-0">
          <h2 id="finance-import-title" className="text-lg font-semibold text-ink">
            {t('finance.import.title')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('finance.import.hint')}</p>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <Textarea
            id="finance-import-paste"
            label={t('finance.import.paste')}
            hint={t('finance.import.pasteHint')}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'05.10.2026\t-450\tUAH\tATB'}
            className="min-h-36 font-mono text-[13px]"
            autoComplete="off"
            spellCheck={false}
          />

          {parsed.rows.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">
                {t('finance.import.count', { count: parsed.rows.length })}
              </p>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
                {parsed.rows.map((row, index) => {
                  const signed = row.type === 'EXPENSE' ? -row.amount : row.amount;
                  const category = row.categoryName
                    ? categories.find((item) => item.name.toLowerCase() === row.categoryName!.toLowerCase())
                    : null;
                  return (
                    <li key={`${row.date}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{row.comment || t('finance.noComment')}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {row.date}
                          {` · ${row.currency}`}
                          {category ? ` · ${category.name}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold ${row.type === 'EXPENSE' ? 'text-expense' : 'text-brand-500'}`}
                        >
                          {formatSignedMoney(signed, language, row.currency)}
                        </p>
                        <Badge>{t(`finance.moneyKind.${row.moneyKind === 'CASH' ? 'cash' : 'electronic'}`)}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : text.trim() ? (
            <p className="text-sm text-muted">{t('finance.import.empty')}</p>
          ) : null}
        </div>

        <ErrorMessage message={error ?? undefined} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={parsed.rows.length === 0}>
            {t('finance.import.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
