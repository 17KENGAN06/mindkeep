import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/Calendar';
import { ForestProgressCard } from '@/components/forest/ForestProgressCard';
import { DailyTaskList } from '@/components/tasks/DailyTaskList';
import { TaskPeriodControls } from '@/components/tasks/TaskPeriodControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateDailyTask,
  useDailyTasksPeriod,
  useDeleteDailyTask,
  useForestSummary,
  useUpdateDailyTask,
} from '@/features/tasks/useDailyTasks';
import type { DailyTask, DailyTaskView } from '@/types/dailyTask';
import { toDateInputValue } from '@/utils/date';

type LocationState = { year?: number; month?: number } | null;

function currentDefaults() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: toDateInputValue(),
  };
}

export function TasksPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navState = location.state as LocationState;
  const defaults = useMemo(() => currentDefaults(), []);

  const [view, setView] = useState<DailyTaskView>('month');
  const [year, setYear] = useState(navState?.year ?? defaults.year);
  const [month, setMonth] = useState(navState?.month ?? defaults.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (navState?.year && navState?.month) {
      return `${navState.year}-${String(navState.month).padStart(2, '0')}-01`;
    }
    return defaults.date;
  });
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const periodQuery = useDailyTasksPeriod({
    view,
    year,
    ...(view === 'month' ? { month } : {}),
  });
  const forestQuery = useForestSummary();
  const createTask = useCreateDailyTask();
  const updateTask = useUpdateDailyTask();
  const deleteTask = useDeleteDailyTask();

  useEffect(() => {
    if (view === 'month' && selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (y !== year || m !== month) {
        setSelectedDate(`${year}-${String(month).padStart(2, '0')}-01`);
      }
    }
  }, [view, year, month, selectedDate]);

  if (periodQuery.isLoading) return <Loader />;
  if (periodQuery.isError || !periodQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const data = periodQuery.data;
  const dayTasks =
    view === 'month' && selectedDate
      ? data.tasks.filter((task) => task.date === selectedDate)
      : [];

  const dayTotals = dayTasks.reduce(
    (acc, task) => {
      acc.total += 1;
      acc.minutes += task.minutes;
      if (task.completed) {
        acc.completed += 1;
        acc.minutesDone += task.minutes;
      }
      return acc;
    },
    { total: 0, completed: 0, minutes: 0, minutesDone: 0 },
  );

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!selectedDate) {
      setFormError(t('tasks.pickDayFirst'));
      return;
    }
    const parsedMinutes = Number(minutes);
    if (!title.trim()) {
      setFormError(t('tasks.errors.title'));
      return;
    }
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 1) {
      setFormError(t('tasks.errors.minutes'));
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        minutes: parsedMinutes,
        date: selectedDate,
      });
      setTitle('');
      setMinutes('30');
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onToggle = async (task: DailyTask) => {
    setBusyId(task.id);
    setFormError(null);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { completed: !task.completed },
      });
    } catch {
      setFormError(t('auth.errors.generic'));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    setBusyId(id);
    setFormError(null);
    try {
      await deleteTask.mutateAsync(id);
    } catch {
      setFormError(t('auth.errors.generic'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('tasks.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('tasks.subtitle')}</p>
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
        {[
          { label: t('tasks.statTotal'), value: data.totals.total },
          { label: t('tasks.statCompleted'), value: data.totals.completed },
          { label: t('tasks.statPending'), value: data.totals.pending + data.totals.overdue },
          {
            label: t('tasks.statMinutes'),
            value: `${data.totals.minutesDone}/${data.totals.minutes}`,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </section>

      {forestQuery.data ? (
        <ForestProgressCard
          totalCompleted={forestQuery.data.totalCompleted}
          completedToday={forestQuery.data.completedToday}
        />
      ) : (
        <div className="h-[240px] rounded-2xl bg-panel/80 shadow-sm ring-1 ring-line md:h-[168px]" />
      )}

      {view === 'year' ? (
        <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <h2 className="text-base font-semibold text-ink">{t('tasks.yearBreakdown')}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.byMonth.map((item) => (
              <button
                key={item.month}
                type="button"
                className="rounded-2xl bg-brand-50/40 px-3 py-3 text-left ring-1 ring-line/70 transition hover:ring-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                onClick={() => {
                  setMonth(item.month);
                  setView('month');
                  setSelectedDate(
                    `${year}-${String(item.month).padStart(2, '0')}-01`,
                  );
                }}
              >
                <p className="text-sm font-medium text-ink">
                  {t(`finance.months.${item.month}`)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t('tasks.monthStats', {
                    total: item.total,
                    completed: item.completed,
                  })}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-500">
                  {item.minutesDone}/{item.minutes} {t('tasks.minShort')}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <Calendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            days={data.days.map((day) => ({ ...day, skipped: 0 }))}
            onMonthChange={(nextYear, nextMonth) => {
              setYear(nextYear);
              setMonth(nextMonth);
            }}
            onSelectDate={setSelectedDate}
          />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">
                {selectedDate
                  ? t('tasks.dayTitle', { date: selectedDate })
                  : t('tasks.pickDay')}
              </h2>
              {selectedDate ? (
                <p className="text-sm text-muted">
                  {t('tasks.dayStats', {
                    completed: dayTotals.completed,
                    total: dayTotals.total,
                    minutes: dayTotals.minutes,
                  })}
                </p>
              ) : null}
            </div>

            <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
              <h3 className="text-sm font-semibold text-ink">{t('tasks.addTask')}</h3>
              <form
                className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_auto]"
                onSubmit={(event) => void onCreate(event)}
              >
                <Input
                  label={t('tasks.taskTitle')}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t('tasks.taskTitlePlaceholder')}
                />
                <Input
                  label={t('tasks.minutes')}
                  type="number"
                  min="1"
                  max="1440"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
                <div className="flex items-end">
                  <Button type="submit" isLoading={createTask.isPending} className="w-full sm:w-auto">
                    {t('tasks.saveTask')}
                  </Button>
                </div>
              </form>
              <ErrorMessage message={formError ?? undefined} />
            </section>

            <DailyTaskList
              tasks={dayTasks}
              onToggle={(task) => void onToggle(task)}
              onDelete={(id) => void onDelete(id)}
              busyId={busyId}
            />
          </section>
        </>
      )}
    </div>
  );
}
