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
import {
  currentPeriodDefaults,
  formatMoney,
  formatSignedMoney,
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

  if (summaryQuery.isLoading || categoriesQuery.isLoading) {
    return <Loader />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const summary = summaryQuery.data;
  const categories = categoriesQuery.data ?? [];
  const byKind = summary.totalsByKind ?? {
    CASH: { income: 0, expense: 0, balance: 0 },
    ELECTRONIC: { income: 0, expense: 0, balance: 0 },
  };

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

  const activeMonths = summary.byMonth.filter(
    (item) => item.income !== 0 || item.expense !== 0,
  );

  const wallets = [
    {
      key: 'CASH' as const,
      title: t('finance.moneyKind.cash'),
      hint: t('finance.wallets.cashHint'),
      Icon: Banknote,
      totals: byKind.CASH,
    },
    {
      key: 'ELECTRONIC' as const,
      title: t('finance.moneyKind.electronic'),
      hint: t('finance.wallets.electronicHint'),
      Icon: WalletCards,
      totals: byKind.ELECTRONIC,
    },
  ];

  return (
    <div className="space-y-6">
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t('finance.totalIncome'),
            value: summary.totals.income,
            tone: 'good' as const,
            signed: true,
          },
          {
            label: t('finance.totalExpense'),
            value: -summary.totals.expense,
            tone: 'bad' as const,
            signed: true,
          },
          {
            label: t('finance.balance'),
            value: summary.totals.balance,
            tone: 'default' as const,
            signed: true,
          },
          {
            label: t('finance.netWithOpening'),
            value: summary.totals.netWithOpening,
            tone: 'default' as const,
            signed: true,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                card.tone === 'good'
                  ? 'text-brand-500'
                  : card.tone === 'bad'
                    ? 'text-red-400'
                    : 'text-ink'
              }`}
            >
              {card.signed
                ? formatSignedMoney(card.value, language)
                : formatMoney(card.value, language)}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t('finance.wallets.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('finance.wallets.subtitle')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {wallets.map((wallet) => {
            const Icon = wallet.Icon;
            return (
              <article
                key={wallet.key}
                className="relative overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-brand-500">
                      <Icon className="h-5 w-5" aria-hidden />
                      <h3 className="font-display text-lg font-semibold text-ink">{wallet.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted">{wallet.hint}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-brand-50/50 px-2.5 py-1.5 text-xs font-semibold text-brand-500 ring-1 ring-line/70 transition hover:bg-brand-50"
                    onClick={() => setKindFilter(wallet.key)}
                  >
                    {t('finance.wallets.showOps')}
                  </button>
                </div>
                <dl className="relative mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-[11px] tracking-wide text-muted uppercase">
                      {t('finance.income')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-brand-500">
                      {formatSignedMoney(wallet.totals.income, language)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-wide text-muted uppercase">
                      {t('finance.expense')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-red-400">
                      {formatSignedMoney(-wallet.totals.expense, language)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] tracking-wide text-muted uppercase">
                      {t('finance.balance')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {formatSignedMoney(wallet.totals.balance, language)}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      {view === 'year' && activeMonths.length > 0 ? (
        <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <h2 className="text-base font-semibold text-ink">{t('finance.yearBreakdown')}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeMonths.map((item) => (
              <div key={item.month} className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70">
                <p className="text-sm font-medium text-ink">{t(`finance.months.${item.month}`)}</p>
                <p className="mt-1 text-xs text-muted">
                  {t('finance.income')}: {formatSignedMoney(item.income, language)}
                </p>
                <p className="text-xs text-muted">
                  {t('finance.expense')}: {formatSignedMoney(-item.expense, language)}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {formatSignedMoney(item.balance, language)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('finance.addOperation')}</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => void onCreate(event)}>
          <Select
            label={t('finance.type')}
            value={type}
            onChange={(event) => setType(event.target.value as FinanceOperationType)}
            options={[
              { value: 'INCOME', label: t('finance.income') },
              { value: 'EXPENSE', label: t('finance.expense') },
            ]}
          />
          <Select
            label={t('finance.moneyKind.label')}
            value={moneyKind}
            onChange={(event) => setMoneyKind(event.target.value as FinanceMoneyKind)}
            options={[
              { value: 'CASH', label: t('finance.moneyKind.cash') },
              { value: 'ELECTRONIC', label: t('finance.moneyKind.electronic') },
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
          <div className="md:col-span-2">
            <ErrorMessage message={formError ?? undefined} />
            <Button type="submit" className="mt-2" isLoading={createOperation.isPending}>
              {t('finance.saveOperation')}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-base font-semibold text-ink">{t('finance.operationsTitle')}</h2>
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
        <FinanceOperationsList
          operations={filteredOperations}
          language={language}
          onDelete={(id) => void onDelete(id)}
          deletingId={deletingId}
          showMoneyKind
        />
      </section>
    </div>
  );
}
