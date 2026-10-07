import { BookOpen, Check, CheckCircle2, Flag, GraduationCap, Repeat } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlanChip } from '@/components/billing/PlanChip';
import { WaterGlasses } from '@/components/nutrition/WaterGlasses';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { userHasModule } from '@/config/appModules';
import { useAuth } from '@/features/auth/useAuth';
import { currencyLabel } from '@/features/finance/currencies';
import {
  currentPeriodDefaults,
  formatSignedMoney,
  summarizeByCurrency,
} from '@/features/finance/financeUtils';
import { useFinanceSummary } from '@/features/finance/useFinance';
import { useNutritionPeriod, useSetWater } from '@/features/nutrition/useNutrition';
import { useRhythmPeriod } from '@/features/rhythm/useRhythm';
import {
  useActivityStatistics,
  useDashboardStatistics,
} from '@/features/statistics/useStatistics';
import {
  useDailyTasksPeriod,
  useUpdateDailyTask,
} from '@/features/tasks/useDailyTasks';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import type { AppLanguage } from '@/i18n';
import type { DailyTask } from '@/types/dailyTask';
import { TimezoneSuggestion } from '@/components/TimezoneSuggestion';
import { useAccountToday } from '@/features/time/useAccountToday';
import { formatDate, lastNKeysFrom } from '@/utils/date';

type WeekTab = 'tasks' | 'reviews';

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

function TodayProgressRow({
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
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm text-muted">{title}</p>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">{valueText}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${safe}%` }} />
        </div>
      </div>
      <p className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-brand-500">{safe}%</p>
    </div>
  );
}


export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { today } = useAccountToday();
  const period = currentPeriodDefaults(today);
  const showTasks = userHasModule(user, 'tasks');
  const showReview = userHasModule(user, 'review');
  const showHabits = userHasModule(user, 'habits');
  const showNutrition = userHasModule(user, 'nutrition');
  const showFinance = userHasModule(user, 'finance');
  const [weekTab, setWeekTab] = useState<WeekTab>(showTasks ? 'tasks' : 'reviews');
  const weekTabId: WeekTab =
    showTasks && (!showReview || weekTab === 'tasks') ? 'tasks' : 'reviews';
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const tasksQuery = useDailyTasksPeriod(
    {
      view: 'month',
      year: period.year,
      month: period.month,
    },
    showTasks,
  );
  const financeQuery = useFinanceSummary(
    {
      view: 'month',
      year: period.year,
      month: period.month,
    },
    showFinance,
  );
  const nutritionQuery = useNutritionPeriod(period.year, period.month, showNutrition);
  const rhythmQuery = useRhythmPeriod(period.year, period.month, showHabits);
  const setWater = useSetWater();
  const updateTask = useUpdateDailyTask();

  const loading =
    dashboardQuery.isLoading ||
    activityQuery.isLoading ||
    (showTasks && tasksQuery.isLoading) ||
    (showFinance && financeQuery.isLoading) ||
    (showNutrition && nutritionQuery.isLoading);

  const weekDays = useMemo(() => lastNKeysFrom(today, 7), [today]);

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
  const todayTasks = sortDailyTasks(
    (tasksQuery.data?.tasks ?? []).filter((task) => task.date === today),
  );
  const todayDone = todayTasks.filter((task) => task.completed).length;
  const todayTotal = todayTasks.length;
  const tasksPercent = todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0;

  const nutrition = nutritionQuery.data;
  const todayMeals = (nutrition?.meals ?? []).filter((meal) => meal.date === today);
  const todayCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const calorieGoal = nutrition?.settings.calorieGoal ?? 2000;
  const waterGoal = nutrition?.settings.waterGoal ?? 8;
  const todayWater = nutrition?.water.find((row) => row.date === today)?.glasses ?? 0;
  const overeating = todayCalories > calorieGoal;

  const reviewsOpen = stats.todayReminders + stats.overdueReminders;
  const reviewsPlanned = stats.completedReviews + reviewsOpen;
  const reviewsPercent = reviewsPlanned > 0 ? (stats.completedReviews / reviewsPlanned) * 100 : 0;

  const currencyBuckets = summarizeByCurrency(financeQuery.data?.operations ?? []);

  const rhythmHabits = rhythmQuery.data?.habits ?? [];
  const rhythmToday = rhythmQuery.data?.today ?? today;
  const rhythmDone = rhythmHabits.filter((habit) => habit.checks.includes(rhythmToday)).length;
  const rhythmTotal = rhythmHabits.length;

  const weekSeries = weekDays.map((date) => {
    const dayTasks = (tasksQuery.data?.tasks ?? []).filter((task) => task.date === date);
    const tasksDone = dayTasks.filter((task) => task.completed).length;
    const tasksPlanned = dayTasks.length;
    const reviewsDone = activityQuery.data.activity.find((point) => point.date === date)?.count ?? 0;

    return { date, tasksDone, tasksPlanned, reviewsDone };
  });

  const chartMax = Math.max(
    1,
    ...weekSeries.map((day) => {
      if (weekTabId === 'tasks') return Math.max(day.tasksPlanned, day.tasksDone);
      return day.reviewsDone;
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

  const onImportantTask = async (task: DailyTask) => {
    setBusyTaskId(task.id);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { important: !task.important },
      });
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <TimezoneSuggestion />
      <section className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {t('dashboard.welcome', { name: user?.name ?? '' })}
        </h1>
        <PlanChip user={user} />
      </section>

      {(showTasks || showReview || showHabits) && (
      <section className="rounded-3xl bg-panel px-4 py-4 shadow-sm ring-1 ring-line sm:px-5">
        <div className="divide-y divide-line/80">
          {showTasks ? (
          <TodayProgressRow
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            title={t('dashboard.cards.tasksToday')}
            valueText={t('dashboard.cards.of', { done: todayDone, total: todayTotal })}
            percent={tasksPercent}
          />
          ) : null}
          {showReview ? (
          <TodayProgressRow
            icon={<GraduationCap className="h-5 w-5" aria-hidden />}
            title={t('dashboard.cards.reviews')}
            valueText={t('dashboard.cards.ofPlanned', {
              done: stats.completedReviews,
              total: reviewsPlanned,
            })}
            percent={reviewsPercent}
          />
          ) : null}
          {showHabits ? (
          <TodayProgressRow
            icon={<Repeat className="h-5 w-5" aria-hidden />}
            title={t('dashboard.cards.rhythmToday')}
            valueText={
              rhythmTotal === 0
                ? t('dashboard.cards.rhythmEmpty')
                : t('dashboard.cards.of', { done: rhythmDone, total: rhythmTotal })
            }
            percent={rhythmTotal === 0 ? 0 : (rhythmDone / rhythmTotal) * 100}
          />
          ) : null}
        </div>
      </section>
      )}

      {showNutrition ? (
      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.fuelTitle')}</h2>
            {overeating ? <Badge tone="danger">{t('calories.overeating')}</Badge> : null}
          </div>
          <Link to="/nutrition" className="text-sm font-medium text-brand-500 no-underline">
            {t('dashboard.allFuel')} →
          </Link>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-sm text-muted">
              {todayCalories} / {calorieGoal} {t('calories.kcal')}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/70">
              <div
                className={`h-full rounded-full ${overeating ? 'bg-red-500' : 'bg-brand-500'}`}
                style={{
                  width: `${Math.min(100, Math.round((todayCalories / Math.max(calorieGoal, 1)) * 100))}%`,
                }}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {todayMeals.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                  {t('dashboard.noMealsToday')}
                </li>
              ) : (
                todayMeals.slice(0, 4).map((meal) => (
                  <li key={meal.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink">{meal.title}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {meal.calories} {t('calories.kcal')}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted">
              {todayWater} / {waterGoal} {t('calories.glasses')}
            </p>
            <WaterGlasses
              glasses={todayWater}
              goal={waterGoal}
              disabled={setWater.isPending}
              onChange={(glasses) => {
                void setWater.mutateAsync({ date: today, glasses });
              }}
            />
          </div>
        </div>
      </section>
      ) : null}

      {(showTasks || showReview) && (
      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        {showTasks ? (
        <article className="min-w-0 overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="min-w-0 text-base font-semibold text-ink">{t('dashboard.upcomingTasks')}</h2>
            <Link to="/tasks" className="shrink-0 text-sm font-medium text-brand-500 no-underline">
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
                      : task.important
                        ? 'bg-amber-500/[0.09] ring-amber-400/45'
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
                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-sm leading-snug font-medium ${
                        task.completed ? 'text-emerald-400 line-through' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </p>
                    {(task.splitCount ?? 1) > 1 ? (
                      <span className="mt-1 inline-flex rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-500">
                        {t('tasks.splitProgress', {
                          done: task.splitDone ?? 0,
                          count: task.splitCount,
                        })}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`min-w-[3.25rem] shrink-0 text-right text-xs font-semibold whitespace-nowrap tabular-nums ${
                      task.completed ? 'text-emerald-400' : task.important ? 'text-amber-700' : 'text-muted'
                    }`}
                  >
                    {task.minutes} {t('tasks.minShort')}
                  </span>
                  <button
                    type="button"
                    aria-pressed={Boolean(task.important)}
                    aria-label={task.important ? t('tasks.unmarkImportant') : t('tasks.markImportant')}
                    title={t('tasks.importantHint')}
                    disabled={busyTaskId === task.id}
                    onClick={() => void onImportantTask(task)}
                    className={`inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg px-2 transition ${
                      task.important
                        ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-[#3a2a08] shadow-[0_0_14px_rgba(245,186,64,0.45)]'
                        : 'text-muted ring-1 ring-line hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <Flag className={`h-3.5 w-3.5 ${task.important ? 'fill-current' : ''}`} aria-hidden />
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">
                      {t('tasks.important')}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </article>
        ) : null}

        {(showTasks || showReview) && (
        <article className="min-w-0 overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <h2 className="min-w-0 text-base font-semibold text-ink">{t('dashboard.weekTitle')}</h2>
            {showTasks && showReview ? (
            <div className="flex flex-wrap gap-1 rounded-2xl bg-brand-50/40 p-1 ring-1 ring-line/60">
              {(
                [
                  ['tasks', t('dashboard.weekTabs.tasks')],
                  ['reviews', t('dashboard.weekTabs.reviews')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    weekTabId === id
                      ? 'bg-brand-500 text-[#07110d]'
                      : 'text-muted hover:text-ink'
                  }`}
                  onClick={() => setWeekTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            ) : null}
          </div>

          <div className="mt-5 flex h-44 min-w-0 items-end gap-1 sm:gap-2">
            {weekSeries.map((day) => {
              const planned = weekTabId === 'tasks' ? day.tasksPlanned : Math.max(day.reviewsDone, 1);
              const done = weekTabId === 'tasks' ? day.tasksDone : day.reviewsDone;
              const plannedHeight = `${Math.max((planned / chartMax) * 100, planned > 0 ? 8 : 4)}%`;
              const doneHeight = `${Math.max((done / chartMax) * 100, done > 0 ? 8 : 0)}%`;

              return (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-32 w-full min-w-0 items-end justify-center">
                    <div
                      className="absolute bottom-0 w-[70%] max-w-8 rounded-t-lg bg-brand-200/80"
                      style={{ height: plannedHeight }}
                    />
                    <div
                      className="relative w-[70%] max-w-8 rounded-t-lg bg-brand-500"
                      style={{ height: doneHeight }}
                    />
                  </div>
                  <span className="w-full truncate text-center text-[10px] text-muted">
                    <span className="sm:hidden">{day.date.slice(8)}</span>
                    <span className="hidden sm:inline">
                      {formatDate(day.date, language).split(' ').slice(0, 2).join(' ')}
                    </span>
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
        )}
      </section>
      )}

      {(showReview || showFinance) && (
      <section className="grid gap-4 xl:grid-cols-2">
        {showReview ? (
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
        ) : null}

        {showFinance ? (
        <article className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{t('dashboard.financeTitle')}</h2>
            <Link to="/finance" className="text-sm font-medium text-brand-500 no-underline">
              {t('dashboard.allFinance')} →
            </Link>
          </div>

          {currencyBuckets.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted">{t('dashboard.modules.noFinance')}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {currencyBuckets.map((bucket) => (
                <li
                  key={bucket.currency}
                  className="rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-semibold text-ink">
                      {currencyLabel(bucket.currency, language)}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatSignedMoney(bucket.balance, language, bucket.currency)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {t('finance.income')} {formatSignedMoney(bucket.income, language, bucket.currency)}
                    {' · '}
                    {t('finance.expense')} {formatSignedMoney(-bucket.expense, language, bucket.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
        ) : null}
      </section>
      )}
    </div>
  );
}
