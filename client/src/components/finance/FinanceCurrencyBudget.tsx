import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  currencyOptions,
  FINANCE_CURRENCIES,
  type FinanceCurrency,
} from '@/features/finance/currencies';
import { formatMoney, periodBudgetTarget } from '@/features/finance/financeUtils';
import type { FinanceView } from '@/types/finance';

type FinanceCurrencyBudgetProps = {
  currency: string;
  language: string;
  view: FinanceView;
  monthlyLimit?: number;
  spent: number;
  showAllSpendingHint?: boolean;
  isSaving: boolean;
  onSave: (amount: number) => Promise<void>;
  onClear: () => Promise<void>;
};

function liveMonthlyCap(draft: string, saved?: number): number | undefined {
  const parsed = Number(draft.replace(',', '.'));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (saved && saved > 0) return saved;
  return undefined;
}

export function FinanceBudgetBar({
  spent,
  target,
  className = '',
}: {
  spent: number;
  target: number | null;
  className?: string;
}) {
  const ratio = target && target > 0 ? spent / target : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const over = Boolean(target) && spent > target!;
  const warn = Boolean(target) && !over && ratio >= 0.8;
  const barClass = over || warn ? 'bg-expense' : 'bg-brand-500';

  return (
    <div className={`h-2 overflow-hidden rounded-full bg-line/70 ${className}`}>
      <div
        className={`h-full rounded-full ${target ? barClass : 'bg-transparent'}`}
        style={{ width: `${target ? percent : 0}%` }}
      />
    </div>
  );
}

export function FinanceCurrencyBudget({
  currency,
  language,
  view,
  monthlyLimit,
  spent,
  showAllSpendingHint = false,
  isSaving,
  onSave,
  onClear,
}: FinanceCurrencyBudgetProps) {
  const { t } = useTranslation();
  const canEdit = view === 'month';
  const [draft, setDraft] = useState(monthlyLimit ? String(monthlyLimit) : '');
  const [error, setError] = useState<string | null>(null);

  // Reset the draft when the saved cap changes (adjusted during render).
  const [draftFor, setDraftFor] = useState(monthlyLimit);
  if (monthlyLimit !== draftFor) {
    setDraftFor(monthlyLimit);
    setDraft(monthlyLimit ? String(monthlyLimit) : '');
    setError(null);
  }

  const previewMonthly = canEdit ? liveMonthlyCap(draft, monthlyLimit) : monthlyLimit;
  const target = periodBudgetTarget(previewMonthly);
  const remaining = target ? target - spent : 0;
  const over = Boolean(target) && remaining < 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(draft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t('finance.limits.invalid'));
      return;
    }
    setError(null);
    await onSave(parsed);
  };

  return (
    <div className="relative mt-4 space-y-3 rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] tracking-wide text-muted uppercase">
            {view === 'year' ? t('finance.limits.yearTitle') : t('finance.limits.monthTitle')}
          </p>
          {view === 'year' ? <p className="mt-0.5 text-xs text-muted">{t('finance.limits.yearHint')}</p> : null}
        </div>
        <p className="text-sm font-semibold tabular-nums text-ink">
          {target
            ? t('finance.limits.spentOf', {
                spent: formatMoney(spent, language, currency),
                budget: formatMoney(target, language, currency),
              })
            : t('finance.limits.noCap')}
        </p>
      </div>

      <FinanceBudgetBar spent={spent} target={target} className="h-2.5" />

      <p className={`text-sm font-medium ${over ? 'text-expense' : 'text-ink'}`}>
        {target
          ? over
            ? t('finance.limits.over', { amount: formatMoney(-remaining, language, currency) })
            : t('finance.limits.left', { amount: formatMoney(remaining, language, currency) })
          : canEdit
            ? t('finance.limits.unsetHint')
            : t('finance.limits.yearSetHint')}
      </p>

      {canEdit ? (
        <>
          <form className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center" onSubmit={(event) => void submit(event)}>
            <label className="sr-only" htmlFor={`budget-${currency}`}>
              {t('finance.limits.amount')}
            </label>
            <input
              id={`budget-${currency}`}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('finance.limits.amount')}
              className={`min-h-10 min-w-0 flex-1 rounded-xl border bg-panel px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${
                error ? 'border-red-400' : 'border-line'
              }`}
            />
            <div className="flex shrink-0 gap-2">
              <Button type="submit" isLoading={isSaving} className="!min-h-10 !px-4">
                {monthlyLimit ? t('common.save') : t('finance.limits.set')}
              </Button>
              {monthlyLimit ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="!min-h-10 !px-3"
                  isLoading={isSaving}
                  onClick={() => void onClear()}
                >
                  {t('finance.limits.remove')}
                </Button>
              ) : null}
            </div>
          </form>
          {error ? (
            <p className="text-xs text-red-500" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
      {showAllSpendingHint ? <p className="text-xs text-muted">{t('finance.limits.allSpending')}</p> : null}
    </div>
  );
}

export function FinanceAddCurrencyBudget({
  language,
  taken,
  isSaving,
  onSave,
}: {
  language: string;
  taken: Iterable<string>;
  isSaving: boolean;
  onSave: (currency: FinanceCurrency, amount: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const takenSet = new Set(taken);
  const free = FINANCE_CURRENCIES.filter((code) => !takenSet.has(code));
  const [currency, setCurrency] = useState<FinanceCurrency>(free[0] ?? 'UAH');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selected = free.includes(currency) ? currency : (free[0] ?? 'UAH');

  if (free.length === 0) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t('finance.limits.invalid'));
      return;
    }
    setError(null);
    await onSave(selected, parsed);
    setAmount('');
  };

  return (
    <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
      <h3 className="text-base font-semibold text-ink">{t('finance.limits.addTitle')}</h3>
      <p className="mt-1 text-sm text-muted">{t('finance.limits.addHint')}</p>
      <form
        className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(event) => void submit(event)}
      >
        <Select
          label={t('finance.currency')}
          value={selected}
          onChange={(event) => setCurrency(event.target.value as FinanceCurrency)}
          options={currencyOptions(language).filter((option) => free.includes(option.value))}
        />
        <Input
          label={t('finance.limits.amount')}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" isLoading={isSaving} className="w-full sm:mb-0.5">
          {t('finance.limits.set')}
        </Button>
      </form>
    </section>
  );
}
