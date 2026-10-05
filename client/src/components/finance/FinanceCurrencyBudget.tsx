import { useEffect, useState, type FormEvent } from 'react';
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
  const target = periodBudgetTarget(monthlyLimit, view);
  const [editing, setEditing] = useState(!target);
  const [draft, setDraft] = useState(monthlyLimit ? String(monthlyLimit) : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditing(!monthlyLimit);
    setDraft(monthlyLimit ? String(monthlyLimit) : '');
    setError(null);
  }, [monthlyLimit]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(draft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t('finance.limits.invalid'));
      return;
    }
    setError(null);
    await onSave(parsed);
    setEditing(false);
  };

  const ratio = target && target > 0 ? spent / target : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const remaining = target ? target - spent : 0;
  const over = Boolean(target) && remaining < 0;
  const warn = Boolean(target) && !over && ratio >= 0.8;
  const barClass = over || warn ? 'bg-expense' : 'bg-brand-500';

  return (
    <div className="relative mt-4 rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
      {target && !editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-muted uppercase">
                {view === 'year' ? t('finance.limits.yearTitle') : t('finance.limits.monthTitle')}
              </p>
              {view === 'year' ? (
                <p className="mt-0.5 text-xs text-muted">{t('finance.limits.yearHint')}</p>
              ) : null}
            </div>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {t('finance.limits.spentOf', {
                spent: formatMoney(spent, language, currency),
                budget: formatMoney(target, language, currency),
              })}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/70">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-sm font-medium ${over ? 'text-expense' : 'text-ink'}`}>
              {over
                ? t('finance.limits.over', { amount: formatMoney(-remaining, language, currency) })
                : t('finance.limits.left', { amount: formatMoney(remaining, language, currency) })}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="!min-h-9 !px-3 !py-1.5"
              onClick={() => setEditing(true)}
            >
              {t('finance.limits.change')}
            </Button>
          </div>
          {showAllSpendingHint ? (
            <p className="text-xs text-muted">{t('finance.limits.allSpending')}</p>
          ) : null}
        </div>
      ) : (
        <form className="space-y-3" onSubmit={(event) => void submit(event)}>
          <Input
            id={`budget-${currency}`}
            label={t('finance.limits.amount')}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            hint={target ? undefined : t('finance.limits.unsetHint')}
            error={error ?? undefined}
            action={
              <Button type="submit" isLoading={isSaving} className="w-full sm:!w-36">
                {target ? t('common.save') : t('finance.limits.set')}
              </Button>
            }
          />
          {target ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" className="!min-h-9 !px-3 !py-1.5" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="!min-h-9 !px-3 !py-1.5"
                isLoading={isSaving}
                onClick={() => void onClear()}
              >
                {t('finance.limits.remove')}
              </Button>
            </div>
          ) : null}
        </form>
      )}
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
      <form className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" onSubmit={(event) => void submit(event)}>
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
