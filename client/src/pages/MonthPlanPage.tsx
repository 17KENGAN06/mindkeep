import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TaskPeriodControls } from '@/components/tasks/TaskPeriodControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useDailyTasksPeriod } from '@/features/tasks/useDailyTasks';
import type { DailyTaskView } from '@/types/dailyTask';

export function MonthPlanPage() {
  const { t } = useTranslation();
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState<DailyTaskView>('year');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const periodQuery = useDailyTasksPeriod({
    view,
    year,
    ...(view === 'month' ? { month } : {}),
  });

  if (periodQuery.isLoading) return <Loader />;
  if (periodQuery.isError || !periodQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const data = periodQuery.data;
  const completion =
    data.totals.total > 0
      ? Math.round((data.totals.completed / data.totals.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('tasks.planTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('tasks.planSubtitle')}</p>
        </div>
        <Link to="/tasks">
          <Button variant="secondary">{t('tasks.openDaily')}</Button>
        </Link>
      </section>

      <TaskPeriodControls
        view={view}
        year={year}
        month={month}
        onViewChange={setView}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t('tasks.statTotal')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{data.totals.total}</p>
        </div>
        <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t('tasks.statCompleted')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">{data.totals.completed}</p>
        </div>
        <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t('tasks.statPending')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-400">
            {data.totals.pending + data.totals.overdue}
          </p>
        </div>
        <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t('tasks.completionRate')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-brand-500">{completion}%</p>
        </div>
      </section>

      {view === 'year' ? (
        <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <h2 className="text-base font-semibold text-ink">{t('tasks.historyByMonth')}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.byMonth.map((item) => {
              const rate =
                item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
              return (
                <Link
                  key={item.month}
                  to="/tasks"
                  state={{ year, month: item.month }}
                  className="rounded-2xl bg-brand-50/40 px-3 py-3 no-underline ring-1 ring-line/70 transition hover:ring-brand-400"
                >
                  <p className="text-sm font-medium text-ink">
                    {t(`finance.months.${item.month}`)} {year}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t('tasks.monthStats', {
                      total: item.total,
                      completed: item.completed,
                    })}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/60">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-brand-500">
                    {rate}% · {item.minutesDone}/{item.minutes} {t('tasks.minShort')}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <h2 className="text-base font-semibold text-ink">{t('tasks.historyByDay')}</h2>
          {data.days.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t('tasks.emptyPeriod')}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.days.map((day) => (
                <li
                  key={day.date}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-50/40 px-4 py-3 ring-1 ring-line/70"
                >
                  <div>
                    <p className="font-medium text-ink">{day.date}</p>
                    <p className="text-xs text-muted">
                      {t('tasks.monthStats', {
                        total: day.total,
                        completed: day.completed,
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-brand-500">
                    {day.minutesDone}/{day.minutes} {t('tasks.minShort')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link to="/tasks" state={{ year, month }}>
              <Button>{t('tasks.openDaily')}</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
