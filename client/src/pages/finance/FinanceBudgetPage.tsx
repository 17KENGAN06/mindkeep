import { useMemo, useState, type FormEvent } from 'react';
import { Banknote, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { FinanceOperationsList } from '@/components/finance/FinanceOperationsList';
import { FinancePeriodControls } from '@/components/finance/FinancePeriodControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { currencyLabel, currencyOptions, type FinanceCurrency } from '@/features/finance/currencies';
import {
  currentPeriodDefaults,
  formatSignedMoney,
  summarizeByCurrency,
} from '@/features/finance/financeUtils';
import {
  useCreateFinanceOperation,
  useDeleteFinanceOperation,
  useFinanceCategories,
  useFinanceSummary,
} from '@/features/finance/useFinance';
import type { AppLanguage } from '@/i18n';
import type { FinanceMoneyKind, FinanceOperationType, FinanceView } from '@/types/finance';

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

type KindFilter = 'ALL' | FinanceMoneyKind;

export function FinanceBudgetPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const defaults = currentPeriodDefaults();

  const [view, setView] = useState<FinanceView>(defaults.view);
  const [year, setYear] = useState(defaults.year);
  const [month, setMonth] = useState(defaults.month);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');

  const [type, setType] = useState<FinanceOperationType>('EXPENSE');
  const [moneyKind, setMoneyKind] = useState<FinanceMoneyKind>('ELECTRONIC');
  const [currency, setCurrency] = useState<FinanceCurrency>('UAH');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [comment, setComment] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const summaryQuery = useFinanceSummary({
    view,
    year,
    ...(view === 'month' ? { month } : {}),
  });
  const categoriesQuery = useFinanceCategories();
  const createOperation = useCreateFinanceOperation();
  const deleteOperation = useDeleteFinanceOperation();

  const filteredOperations = useMemo(() => {
    const ops = summaryQuery.data?.operations ?? [];
    if (kindFilter === 'ALL') return ops;
    return ops.filter((op) => (op.moneyKind ?? 'ELECTRONIC') === kindFilter);
  }, [summaryQuery.data?.operations, kindFilter]);

  const currencyBuckets = useMemo(
    () => summarizeByCurrency(filteredOperations),
    [filteredOperations],
  );

  if (summaryQuery.isLoading || categoriesQuery.isLoading) {
    return <Loader />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const categories = categoriesQuery.data ?? [];

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(t('finance.errors.amount'));
      return;
    }

    try {
      await createOperation.mutateAsync({
        type,
        moneyKind,
        currency,
        amount: parsedAmount,
        date,
        comment,
        categoryId: categoryId || null,
      });
      setAmount('');
      setComment('');
      setCategoryId('');
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || t('auth.errors.generic'));
        return;
      }
      setFormError(t('auth.errors.generic'));
    }
  };

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
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('finance.budgetTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('finance.budgetSubtitle')}</p>
      </section>

      <FinancePeriodControls
        view={view}
        year={year}
        month={month}
        onViewChange={setView}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      <section className="min-w-0 overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('finance.addOperation')}</h2>
        <form className="mt-4 grid min-w-0 gap-3 md:grid-cols-2" onSubmit={(event) => void onCreate(event)}>
          <div className="grid min-w-0 gap-3 md:col-span-2 md:grid-cols-2 md:items-start">
            <Select
              label={t('finance.moneyKind.label')}
              value={moneyKind}
              onChange={(event) => setMoneyKind(event.target.value as FinanceMoneyKind)}
              options={[
                { value: 'ELECTRONIC', label: t('finance.moneyKind.electronic') },
                { value: 'CASH', label: t('finance.moneyKind.cash') },
              ]}
            />
            <Select
              label={t('finance.currency')}
              value={currency}
              onChange={(event) => setCurrency(event.target.value as FinanceCurrency)}
              options={currencyOptions(language)}
            />
          </div>
          <Select
            label={t('finance.type')}
            value={type}
            onChange={(event) => setType(event.target.value as FinanceOperationType)}
            options={[
              { value: 'EXPENSE', label: t('finance.expense') },
              { value: 'INCOME', label: t('finance.income') },
            ]}
          />
          <Input
            label={t('finance.amount')}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Input
            label={t('finance.date')}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <Select
            label={t('finance.category')}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            placeholder={t('finance.noCategory')}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <Input
            label={t('finance.comment')}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="min-w-0 md:col-span-2">
            <ErrorMessage message={formError ?? undefined} />
            <Button type="submit" className="mt-2" isLoading={createOperation.isPending}>
              {t('finance.saveOperation')}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('finance.perCurrencyTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('finance.perCurrencyHint')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'ALL' as const, label: t('finance.moneyKind.all') },
                { id: 'CASH' as const, label: t('finance.moneyKind.cash') },
                { id: 'ELECTRONIC' as const, label: t('finance.moneyKind.electronic') },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  kindFilter === item.id
                    ? 'bg-brand-500 text-[#07110d]'
                    : 'bg-panel text-muted ring-1 ring-line hover:text-ink'
                }`}
                onClick={() => setKindFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {currencyBuckets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-brand-50/40 px-4 py-10 text-center">
            <p className="text-sm font-medium text-ink">{t('finance.emptyCurrencies')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {currencyBuckets.map((bucket) => {
              const ops = filteredOperations.filter((op) => (op.currency || 'EUR') === bucket.currency);
              const months = bucket.byMonth.filter((item) => item.income !== 0 || item.expense !== 0);
              return (
                <article
                  key={bucket.currency}
                  className="min-w-0 overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line"
                >
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl"
                    />
                    <div className="relative flex flex-wrap items-end justify-between gap-3">
                      <h3 className="min-w-0 font-display text-xl font-semibold text-ink">
                        {currencyLabel(bucket.currency, language)}
                      </h3>
                      <p className="text-2xl font-semibold text-ink">
                        {formatSignedMoney(bucket.balance, language, bucket.currency)}
                      </p>
                    </div>

                    <dl className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
                        <dt className="text-[11px] tracking-wide text-muted uppercase">
                          {t('finance.income')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-brand-500">
                          {formatSignedMoney(bucket.income, language, bucket.currency)}
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
                        <dt className="text-[11px] tracking-wide text-muted uppercase">
                          {t('finance.expense')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-expense">
                          {formatSignedMoney(-bucket.expense, language, bucket.currency)}
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
                        <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
                          <WalletCards className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                          {t('finance.moneyKind.electronic')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-ink">
                          {formatSignedMoney(bucket.byKind.ELECTRONIC.balance, language, bucket.currency)}
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
                        <dt className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted uppercase">
                          <Banknote className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                          {t('finance.moneyKind.cash')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-ink">
                          {formatSignedMoney(bucket.byKind.CASH.balance, language, bucket.currency)}
                        </dd>
                      </div>
                    </dl>

                    {view === 'year' && months.length > 0 ? (
                      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {months.map((item) => (
                          <div
                            key={item.month}
                            className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70"
                          >
                            <p className="text-sm font-medium text-ink">
                              {t(`finance.months.${item.month}`)}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {t('finance.income')}:{' '}
                              {formatSignedMoney(item.income, language, bucket.currency)}
                            </p>
                            <p className="text-xs text-muted">
                              {t('finance.expense')}:{' '}
                              {formatSignedMoney(-item.expense, language, bucket.currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {ops.length > 0 ? (
                    <div className="relative mt-5">
                      <FinanceOperationsList
                        operations={ops}
                        language={language}
                        onDelete={(id) => void onDelete(id)}
                        deletingId={deletingId}
                        showMoneyKind
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
