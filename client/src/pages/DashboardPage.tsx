import {
  BookOpen,
  Check,
  CheckCircle2,
  GraduationCap,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { currentPeriodDefaults, formatCurrencyLines, formatMoney, formatSignedMoney, pickFieldByCurrency } from '@/features/finance/financeUtils';
import { useFinanceSummary } from '@/features/finance/useFinance';
import {
  useActivityStatistics,
  useDashboardStatistics,
} from '@/features/statistics/useStatistics';
import {
  useDailyTasksPeriod,
  useUpdateDailyTask,
} from '@/features/tasks/useDailyTasks';
import type { AppLanguage } from '@/i18n';
import type { FinanceCurrency } from '@/types/finance';
import type { DailyTask } from '@/types/dailyTask';
import { formatDate, toDateInputValue } from '@/utils/date';

type WeekTab = 'tasks' | 'reviews' | 'expenses';

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

function ProgressCard({
  icon,
  title,
  valueText,
  percent,
}: {
  icon: ReactNode;
  title: string;
  valueText: string;
  percent: number;
}) {
  const safe = clampPercent(percent);
  return (
    <div className="rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-2 text-lg font-semibold text-ink sm:text-xl">{valueText}</p>
        </div>
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
          {icon}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line/70">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${safe}%` }} />
      </div>
      <p className="mt-2 text-xs font-medium text-brand-500">{safe}%</p>
    </div>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line/50"
        />
        {total > 0
          ? segments.map((segment, index) => {
              const length = (segment.value / total) * circumference;
              const circle = (
                <circle
                  key={`${segment.color}-${index}`}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += length;
              return circle;
            })
          : null}
      </svg>
      <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-ink">{centerValue}</p>
        <p className="mt-0.5 text-[11px] text-muted">{centerLabel}</p>
      </div>
    </div>
  );
}

const DONUT_COLORS = ['#8eefb4', '#5b8def', '#a78bfa', '#f59e0b', '#94a3b8', '#f472b6'];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const period = currentPeriodDefaults();
  const today = toDateInputValue();
  const [weekTab, setWeekTab] = useState<WeekTab>('tasks');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const tasksQuery = useDailyTasksPeriod({
    view: 'month',
    year: period.year,
    month: period.month,
  });
  const financeQuery = useFinanceSummary({
    view: 'month',
    year: period.year,
    month: period.month,
  });
  const updateTask = useUpdateDailyTask();

  const loading =
    dashboardQuery.isLoading ||
    activityQuery.isLoading ||
    tasksQuery.isLoading ||
    financeQuery.isLoading;

  const weekDays = useMemo(() => {
    const days: string[] = [];
    const base = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(base);
      day.setDate(base.getDate() - i);
      days.push(toDateInputValue(day));
    }
    return days;
  }, []);

  if (loading) return <Loader />;

  if (
    dashboardQuery.isError ||
    activityQuery.isError ||
    !dashboardQuery.data ||
    !activityQuery.data
  ) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { stats, recentMaterials } = dashboardQuery.data;
  const todayTasks = (tasksQuery.data?.tasks ?? []).filter((task) => task.date === today);
  const todayDone = todayTasks.filter((task) => task.completed).length;
  const todayTotal = todayTasks.length;
  const tasksPercent = todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0;

  const reviewsOpen = stats.todayReminders + stats.overdueReminders;
  const reviewsPlanned = stats.completedReviews + reviewsOpen;
  const reviewsPercent = reviewsPlanned > 0 ? (stats.completedReviews / reviewsPlanned) * 100 : 0;

  const finance = financeQuery.data;
  const totalsByCurrency = finance?.totalsByCurrency ?? [];

  const spentTodayByCurrency = new Map<FinanceCurrency, number>();
  for (const op of finance?.operations ?? []) {
    if (op.type !== 'EXPENSE' || op.date.slice(0, 10) !== today) continue;
    spentTodayByCurrency.set(
      op.currency,
      (spentTodayByCurrency.get(op.currency) ?? 0) + op.amount,
    );
  }
  const spentTodayItems = [...spentTodayByCurrency.entries()].map(([currency, amount]) => ({
    currency,
    amount,
  }));
  const spentTodayText =
    spentTodayItems.length > 0
      ? formatCurrencyLines(spentTodayItems, language)
      : formatMoney(0, finance?.settings.displayCurrency ?? 'EUR', language);

  const expenseItems = pickFieldByCurrency(totalsByCurrency, 'expense');
  const incomeItems = pickFieldByCurrency(totalsByCurrency, 'income');
  const balanceItems = pickFieldByCurrency(totalsByCurrency, 'balance');
  const budgetLeftText =
    balanceItems.length > 0
      ? formatCurrencyLines(balanceItems, language, true)
      : formatMoney(0, finance?.settings.displayCurrency ?? 'EUR', language);

  // Category chart: only when every expense line shares one currency (no fake %).
  const categoryRows = (finance?.byCategory ?? [])
    .flatMap((item) =>
      item.expenses.map((row) => ({
        id: item.id,
        name: item.name,
        currency: row.currency,
        expense: row.expense,
      })),
    )
    .filter((item) => item.expense > 0);
  const categoryCurrencies = new Set(categoryRows.map((item) => item.currency));
  const singleCategoryCurrency =
    categoryCurrencies.size === 1 ? [...categoryCurrencies][0]! : null;
  const categorySegments = singleCategoryCurrency
    ? categoryRows
        .filter((item) => item.currency === singleCategoryCurrency)
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          color: DONUT_COLORS[index % DONUT_COLORS.length]!,
        }))
    : [];
  const categoryTotal = categorySegments.reduce((sum, item) => sum + item.expense, 0);

  const weekSeries = weekDays.map((date) => {
    const dayTasks = (tasksQuery.data?.tasks ?? []).filter((task) => task.date === date);
    const tasksDone = dayTasks.filter((task) => task.completed).length;
    const tasksPlanned = dayTasks.length;
    const reviewsDone = activityQuery.data.activity.find((point) => point.date === date)?.count ?? 0;
    const dayExpenses = (finance?.operations ?? []).filter(
      (op) => op.type === 'EXPENSE' && op.date.slice(0, 10) === date,
    );
    // Chart height = expense count (amounts in mixed currencies cannot be compared).
    const expenses = dayExpenses.length;

    return { date, tasksDone, tasksPlanned, reviewsDone, expenses };
  });

  const chartMax = Math.max(
    1,
    ...weekSeries.map((day) => {
      if (weekTab === 'tasks') return Math.max(day.tasksPlanned, day.tasksDone);
      if (weekTab === 'reviews') return day.reviewsDone;
      return day.expenses;
    }),
  );

  const onToggleTask = async (task: DailyTask) => {
    setBusyTaskId(task.id);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { completed: !task.completed },
      });
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('dashboard.welcome', { name: user?.name ?? '' })}
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">{t('dashboard.tagline')}</p>
        </div>
        <p className="max-w-sm text-sm text-muted italic lg:text-right">{t('dashboard.quote')}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProgressCard
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
          title={t('dashboard.cards.tasksToday')}
          valueText={t('dashboard.cards.of', { done: todayDone, total: todayTotal })}
          percent={tasksPercent}
        />
        <ProgressCard
          icon={<GraduationCap className="h-5 w-5" aria-hidden />}
          title={t('dashboard.cards.reviews')}
          valueText={t('dashboard.cards.ofPlanned', {
            done: stats.completedReviews,
            total: reviewsPlanned,
          })}
          percent={reviewsPercent}
        />
        <ProgressCard
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          title={t('dashboard.cards.spentToday')}
          valueText={spentTodayText}
          percent={spentTodayItems.length > 0 ? 100 : 0}
        />
        <ProgressCard
          icon={<PiggyBank className="h-5 w-5" aria-hidden />}
          title={t('dashboard.cards.budgetLeft')}
          valueText={budgetLeftText}
          percent={balanceItems.some((item) => item.amount > 0) ? 70 : balanceItems.length ? 30 : 0}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.upcomingTasks')}</h2>
            <Link to="/tasks" className="text-sm font-medium text-brand-500 no-underline">
              {t('dashboard.allTasks')} →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {todayTasks.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                {t('dashboard.modules.noTasksToday')}
              </li>
            ) : (
              todayTasks.slice(0, 6).map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 ring-1 transition ${
                    task.completed
                      ? 'bg-emerald-500/10 ring-emerald-500/25'
                      : 'bg-brand-50/30 ring-line/70'
                  }`}
                >
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                      task.completed
                        ? 'border-brand-500 bg-brand-500 text-[#07110d]'
                        : 'border-line bg-transparent text-transparent hover:border-brand-400'
                    }`}
                    aria-pressed={task.completed}
                    disabled={busyTaskId === task.id}
                    onClick={() => void onToggleTask(task)}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <p
                    className={`min-w-0 flex-1 truncate text-sm font-medium ${
                      task.completed ? 'text-emerald-400 line-through' : 'text-ink'
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {task.minutes} {t('tasks.minShort')}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.weekTitle')}</h2>
            <div className="flex flex-wrap gap-1 rounded-2xl bg-brand-50/40 p-1 ring-1 ring-line/60">
              {(
                [
                  ['tasks', t('dashboard.weekTabs.tasks')],
                  ['reviews', t('dashboard.weekTabs.reviews')],
                  ['expenses', t('dashboard.weekTabs.expenses')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    weekTab === id
                      ? 'bg-brand-500 text-[#07110d]'
                      : 'text-muted hover:text-ink'
                  }`}
                  onClick={() => setWeekTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex h-44 items-end gap-2">
            {weekSeries.map((day) => {
              const planned =
                weekTab === 'tasks'
                  ? day.tasksPlanned
                  : weekTab === 'reviews'
                    ? Math.max(day.reviewsDone, 1)
                    : day.expenses;
              const done =
                weekTab === 'tasks'
                  ? day.tasksDone
                  : weekTab === 'reviews'
                    ? day.reviewsDone
                    : day.expenses;
              const plannedHeight = `${Math.max((planned / chartMax) * 100, planned > 0 ? 8 : 4)}%`;
              const doneHeight = `${Math.max((done / chartMax) * 100, done > 0 ? 8 : 0)}%`;

              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-32 w-full items-end justify-center">
                    <div
                      className="absolute bottom-0 w-[70%] max-w-8 rounded-t-lg bg-brand-200/80"
                      style={{ height: plannedHeight }}
                    />
                    <div
                      className="relative w-[70%] max-w-8 rounded-t-lg bg-brand-500"
                      style={{ height: doneHeight }}
                    />
                  </div>
                  <span className="text-[10px] text-muted">
                    {formatDate(day.date, language).split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
              {t('dashboard.legendDone')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-200" />
              {t('dashboard.legendPlanned')}
            </span>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.recentTitle')}</h2>
            <Link to="/materials" className="text-sm font-medium text-brand-500 no-underline">
              {t('dashboard.viewAllMaterials')} →
            </Link>
          </div>
          {recentMaterials.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={t('materials.emptyTitle')}
                description={t('materials.emptyDescription')}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentMaterials.slice(0, 4).map((material, index) => {
                const progress = material.status === 'ARCHIVED' ? 100 : 28 + ((index * 17) % 55);
                return (
                  <li key={material.id}>
                    <Link
                      to={`/materials/${material.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-brand-50/30 px-3 py-3 no-underline ring-1 ring-line/70 transition hover:ring-brand-400"
                    >
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
                        <BookOpen className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{material.title}</p>
                        <p className="text-xs text-muted">
                          {material.category?.name ?? t('materials.fields.noCategory')} ·{' '}
                          {formatDate(material.learnedAt, language)}
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-brand-500">
                        {progress}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.financeTitle')}</h2>
            <Link to="/finance" className="text-sm font-medium text-brand-500 no-underline">
              {t('dashboard.allFinance')} →
            </Link>
          </div>

          {!finance || (categoryTotal === 0 && totalsByCurrency.length === 0) ? (
            <p className="mt-8 text-center text-sm text-muted">{t('dashboard.modules.noFinance')}</p>
          ) : categorySegments.length > 0 ? (
            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <DonutChart
                segments={categorySegments.map((item) => ({
                  value: item.expense,
                  color: item.color,
                }))}
                centerValue={formatMoney(categoryTotal, singleCategoryCurrency!, language)}
                centerLabel={t('dashboard.spentLabel')}
              />
              <ul className="w-full flex-1 space-y-2">
                {categorySegments.map((item) => {
                  const share = Math.round((item.expense / categoryTotal) * 100);
                  return (
                    <li
                      key={`${item.id ?? item.name}-${item.currency}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-ink">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-muted">
                        {formatMoney(item.expense, item.currency, language)} · {share}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {totalsByCurrency.map((row) => (
                <li
                  key={row.currency}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50/30 px-3 py-3 text-sm ring-1 ring-line/70"
                >
                  <span className="font-medium text-ink">{row.currency}</span>
                  <span className="text-muted">
                    {formatSignedMoney(row.balance, row.currency, language)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {finance && (incomeItems.length > 0 || expenseItems.length > 0) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {incomeItems.length > 0 ? (
                <Badge tone="success">
                  {t('finance.totalIncome')}: {formatCurrencyLines(incomeItems, language, true)}
                </Badge>
              ) : null}
              {expenseItems.length > 0 ? (
                <Badge tone="danger">
                  {t('finance.totalExpense')}:{' '}
                  {formatCurrencyLines(
                    expenseItems.map((item) => ({ ...item, amount: -Math.abs(item.amount) })),
                    language,
                    true,
                  )}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
