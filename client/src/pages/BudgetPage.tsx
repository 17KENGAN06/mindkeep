import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import {
  useBudgetCategories,
  useBudgetMonth,
  useBudgetYear,
  useCreateBudgetCategory,
  useCreateBudgetOperation,
  useCreateMandatory,
  useCreatePlannedExpense,
  useRemoveBudgetOperation,
  useToggleMandatory,
  useUpdateBudgetSettings,
} from '@/features/budget/useBudget';
import type { BudgetCurrency, BudgetOperationType } from '@/types/budget';

const CURRENCIES: BudgetCurrency[] = ['RUB', 'USD', 'EUR', 'UAH'];

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatMoney(value: number, currency: BudgetCurrency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BudgetPage() {
  const { t } = useTranslation();
  const initial = useMemo(() => currentYearMonth(), []);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [view, setView] = useState<'month' | 'year'>('month');

  const monthQuery = useBudgetMonth(year, month);
  const yearQuery = useBudgetYear(year);
  const categoriesQuery = useBudgetCategories();
  const updateSettings = useUpdateBudgetSettings();
  const createOperation = useCreateBudgetOperation();
  const createCategory = useCreateBudgetCategory();
  const removeOperation = useRemoveBudgetOperation();
  const createMandatory = useCreateMandatory();
  const toggleMandatory = useToggleMandatory();
  const createPlanned = useCreatePlannedExpense();

  const [amount, setAmount] = useState('');
  const [opType, setOpType] = useState<BudgetOperationType>('EXPENSE');
  const [comment, setComment] = useState('');
  const [opDate, setOpDate] = useState(todayKey());
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [mandatoryName, setMandatoryName] = useState('');
  const [mandatoryDay, setMandatoryDay] = useState(1);
  const [mandatoryAmount, setMandatoryAmount] = useState('');
  const [plannedName, setPlannedName] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const currency = monthQuery.data?.displayCurrency ?? 'RUB';

  async function onCreateOperation(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    await createOperation.mutateAsync({
      date: opDate,
      amount: value,
      type: opType,
      comment,
      categoryId: categoryId || null,
    });
    setAmount('');
    setComment('');
  }

  async function onCreateMandatory(event: FormEvent) {
    event.preventDefault();
    const value = Number(mandatoryAmount);
    if (!mandatoryName.trim() || !value) return;
    await createMandatory.mutateAsync({
      name: mandatoryName.trim(),
      dayOfMonth: mandatoryDay,
      amount: value,
    });
    setMandatoryName('');
    setMandatoryAmount('');
  }

  async function onCreatePlanned(event: FormEvent) {
    event.preventDefault();
    const value = Number(plannedAmount);
    if (!plannedName.trim() || !value) return;
    await createPlanned.mutateAsync({
      name: plannedName.trim(),
      amount: value,
      targetYear: year + 1,
    });
    setPlannedName('');
    setPlannedAmount('');
  }

  if (view === 'month' && monthQuery.isLoading) return <Loader />;
  if (view === 'year' && yearQuery.isLoading) return <Loader />;
  if (view === 'month' && (monthQuery.isError || !monthQuery.data)) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }
  if (view === 'year' && (yearQuery.isError || !yearQuery.data)) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const monthData = monthQuery.data;
  const yearData = yearQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('budget.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('budget.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={view === 'month' ? 'primary' : 'secondary'}
            onClick={() => setView('month')}
          >
            {t('budget.monthView')}
          </Button>
          <Button
            type="button"
            variant={view === 'year' ? 'primary' : 'secondary'}
            onClick={() => setView('year')}
          >
            {t('budget.yearView')}
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label={t('budget.fields.month')}
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[year - 1, year, year + 1].map((y) => ({
            value: String(y),
            label: String(y),
          }))}
        />
        {view === 'month' ? (
          <Select
            label={t('budget.fields.month')}
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
              value: String(m),
              label: t(`budget.months.${m}`),
            }))}
          />
        ) : (
          <div />
        )}
        <Select
          label={currency}
          value={currency}
          onChange={(e) =>
            void updateSettings.mutateAsync({
              displayCurrency: e.target.value as BudgetCurrency,
            })
          }
          options={CURRENCIES.map((item) => ({ value: item, label: item }))}
        />
      </div>
      <p className="text-xs text-muted">
        {t('budget.fxNote', { date: monthData?.fx.asOf ?? yearData?.fx.asOf ?? '—' })}
      </p>

      {view === 'month' && monthData ? (
        <>
          <section className="rounded-2xl bg-panel p-5 ring-1 ring-line">
            <p className="text-xs uppercase tracking-wide text-muted">{t('budget.currentBalance')}</p>
            <p className="mt-2 font-display text-4xl font-semibold text-ink">
              {formatMoney(monthData.overview.currentBalance, currency)}
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <OverviewRow
              label={t('budget.overview.opening')}
              value={formatMoney(monthData.overview.openingBalance, currency)}
            />
            <OverviewRow
              label={t('budget.overview.closing')}
              value={formatMoney(monthData.overview.closingBalance, currency)}
            />
            <OverviewRow
              label={t('budget.overview.income')}
              value={formatMoney(monthData.overview.income, currency)}
            />
            <OverviewRow
              label={t('budget.overview.expenses')}
              value={formatMoney(monthData.overview.expenses, currency)}
              tone="expense"
            />
            <OverviewRow
              label={t('budget.overview.mandatory')}
              value={formatMoney(monthData.overview.mandatoryPayments, currency)}
              tone="mandatory"
            />
            <OverviewRow
              label={t('budget.overview.difference')}
              value={formatMoney(monthData.overview.difference, currency)}
              tone={monthData.overview.difference < 0 ? 'expense' : 'default'}
            />
          </section>

          <section className="space-y-3 rounded-2xl bg-panel p-4 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-ink">{t('budget.mandatoryTitle')}</h2>
            <form onSubmit={(e) => void onCreateMandatory(e)} className="grid gap-2 sm:grid-cols-4 sm:items-end">
              <Input
                label={t('budget.fields.name')}
                value={mandatoryName}
                onChange={(e) => setMandatoryName(e.target.value)}
              />
              <Input
                label={t('budget.fields.date')}
                type="number"
                min={1}
                max={28}
                value={mandatoryDay}
                onChange={(e) => setMandatoryDay(Number(e.target.value))}
              />
              <Input
                label={t('budget.fields.amount')}
                type="number"
                step="0.01"
                value={mandatoryAmount}
                onChange={(e) => setMandatoryAmount(e.target.value)}
              />
              <Button type="submit">{t('budget.addMandatory')}</Button>
            </form>
            <ul className="space-y-2">
              {monthData.mandatory.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ring-line ${
                    item.paid ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <label className="flex items-center gap-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={item.paid}
                      onChange={(e) =>
                        void toggleMandatory.mutateAsync({
                          id: item.id,
                          year,
                          month,
                          paid: e.target.checked,
                        })
                      }
                    />
                    <span>
                      {item.index}. {item.name} · {item.dayOfMonth}.
                      {String(month).padStart(2, '0')} ·{' '}
                      {formatMoney(item.amountDisplay, currency)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl bg-panel p-4 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-ink">{t('budget.operationsTitle')}</h2>
            <form
              onSubmit={(e) => void onCreateOperation(e)}
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:items-end"
            >
              <Input
                label={t('budget.fields.date')}
                type="date"
                value={opDate}
                onChange={(e) => setOpDate(e.target.value)}
              />
              <Input
                label={t('budget.fields.amount')}
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Select
                label={t('budget.fields.type')}
                value={opType}
                onChange={(e) => setOpType(e.target.value as BudgetOperationType)}
                options={[
                  { value: 'INCOME', label: t('budget.types.INCOME') },
                  { value: 'EXPENSE', label: t('budget.types.EXPENSE') },
                ]}
              />
              <Select
                label={t('budget.fields.category')}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder={t('planner.fields.noCategory')}
                options={(categoriesQuery.data ?? []).map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
              <Input
                label={t('budget.fields.comment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button type="submit">{t('budget.addOperation')}</Button>
            </form>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <Input
                label={t('budget.addCategory')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!newCategoryName.trim() || createCategory.isPending}
                onClick={() => {
                  if (!newCategoryName.trim()) return;
                  void createCategory.mutateAsync(newCategoryName.trim()).then((result) => {
                    setCategoryId(result.category.id);
                    setNewCategoryName('');
                  });
                }}
              >
                {t('budget.addCategory')}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="px-2 py-2 font-medium">{t('budget.fields.date')}</th>
                    <th className="px-2 py-2 font-medium">{t('budget.fields.amount')}</th>
                    <th className="px-2 py-2 font-medium">{t('budget.fields.type')}</th>
                    <th className="px-2 py-2 font-medium">{t('budget.fields.category')}</th>
                    <th className="px-2 py-2 font-medium">{t('budget.fields.comment')}</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {monthData.operations.map((op) => (
                    <tr key={op.id} className="border-t border-line/70">
                      <td className="px-2 py-2 text-ink">{op.dateKey}</td>
                      <td className="px-2 py-2 text-ink">
                        {formatMoney(op.amountDisplay, currency)}
                      </td>
                      <td
                        className={`px-2 py-2 ${
                          op.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {t(`budget.types.${op.type}`)}
                      </td>
                      <td className="px-2 py-2 text-muted">{op.category?.name || '—'}</td>
                      <td className="px-2 py-2 text-muted">{op.comment || '—'}</td>
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void removeOperation.mutateAsync(op.id)}
                        >
                          {t('common.delete')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Input
            label={t('budget.fields.openingBalance')}
            hint={t('budget.openingHint')}
            type="number"
            step="0.01"
            value={openingBalance || String(monthData.settings.openingBalance)}
            onChange={(e) => setOpeningBalance(e.target.value)}
            onBlur={() => {
              const value = Number(openingBalance || monthData.settings.openingBalance);
              if (!Number.isNaN(value)) {
                void updateSettings.mutateAsync({ openingBalance: value });
              }
            }}
          />
        </>
      ) : null}

      {view === 'year' && yearData ? (
        <>
          <section className="rounded-2xl bg-panel p-5 ring-1 ring-line">
            <p className="text-xs uppercase tracking-wide text-muted">{t('budget.yearOpening')}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {formatMoney(yearData.openingBalance, yearData.displayCurrency)}
            </p>
          </section>

          <div className="overflow-x-auto rounded-2xl bg-panel p-4 ring-1 ring-line">
            <table className="min-w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-2 py-2">{t('budget.fields.month')}</th>
                  <th className="px-2 py-2">{t('budget.overview.opening')}</th>
                  <th className="px-2 py-2">{t('budget.overview.income')}</th>
                  <th className="px-2 py-2">{t('budget.overview.expenses')}</th>
                  <th className="px-2 py-2">{t('budget.overview.mandatory')}</th>
                  <th className="px-2 py-2">{t('budget.overview.difference')}</th>
                  <th className="px-2 py-2">{t('budget.overview.closing')}</th>
                </tr>
              </thead>
              <tbody>
                {yearData.months.map((row) => (
                  <tr key={row.month} className="border-t border-line/70">
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="font-medium text-brand-500"
                        onClick={() => {
                          setMonth(row.month);
                          setView('month');
                        }}
                      >
                        {t(`budget.months.${row.month}`)}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      {formatMoney(row.openingBalance, yearData.displayCurrency)}
                    </td>
                    <td className="px-2 py-2">
                      {formatMoney(row.income, yearData.displayCurrency)}
                    </td>
                    <td className="px-2 py-2 text-red-600">
                      {formatMoney(row.expenses, yearData.displayCurrency)}
                    </td>
                    <td className="px-2 py-2">
                      {formatMoney(row.mandatoryPayments, yearData.displayCurrency)}
                    </td>
                    <td className="px-2 py-2">
                      {formatMoney(row.difference, yearData.displayCurrency)}
                    </td>
                    <td className="px-2 py-2">
                      {formatMoney(row.closingBalance, yearData.displayCurrency)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-line font-semibold">
                  <td className="px-2 py-2">{t('budget.total')}</td>
                  <td className="px-2 py-2">—</td>
                  <td className="px-2 py-2">
                    {formatMoney(yearData.totals.income, yearData.displayCurrency)}
                  </td>
                  <td className="px-2 py-2 text-red-600">
                    {formatMoney(yearData.totals.expenses, yearData.displayCurrency)}
                  </td>
                  <td className="px-2 py-2">
                    {formatMoney(yearData.totals.mandatoryPayments, yearData.displayCurrency)}
                  </td>
                  <td className="px-2 py-2">
                    {formatMoney(yearData.totals.difference, yearData.displayCurrency)}
                  </td>
                  <td className="px-2 py-2">
                    {formatMoney(yearData.totals.closingBalance, yearData.displayCurrency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="space-y-3 rounded-2xl bg-panel p-4 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-ink">
              {t('budget.plannedTitle', { year: year + 1 })}
            </h2>
            <form
              onSubmit={(e) => void onCreatePlanned(e)}
              className="grid gap-2 sm:grid-cols-3 sm:items-end"
            >
              <Input
                label={t('budget.fields.name')}
                value={plannedName}
                onChange={(e) => setPlannedName(e.target.value)}
              />
              <Input
                label={t('budget.fields.amount')}
                type="number"
                step="0.01"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
              />
              <Button type="submit">{t('budget.addPlanned')}</Button>
            </form>
            <ul className="space-y-2 text-sm text-ink">
              {yearData.plannedNextYear.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 border-t border-line/60 py-2"
                >
                  <span>{item.name}</span>
                  <span>{formatMoney(item.amountDisplay, yearData.displayCurrency)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <p className="text-xs text-muted">
        <Link to="/statistics" className="text-brand-500 no-underline hover:underline">
          {t('nav.statistics')}
        </Link>
      </p>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'expense' | 'mandatory';
}) {
  const toneClass =
    tone === 'expense'
      ? 'bg-red-500/10'
      : tone === 'mandatory'
        ? 'bg-amber-500/10'
        : 'bg-panel';

  return (
    <div className={`rounded-2xl p-4 ring-1 ring-line ${toneClass}`}>
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
