import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/Calendar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import {
  useCompleteOccurrence,
  useCreatePlannerTask,
  usePlannerCategories,
  usePlannerOccurrences,
  usePlannerStatistics,
  useRemoveOccurrence,
  useRescheduleOccurrence,
  useCreateTaskCategory,
  useUpdateTaskRecurrence,
} from '@/features/planner/usePlanner';
import type { CalendarDaySummary } from '@/types/calendar';
import type { PlannerFilter, TaskOccurrence, TaskRecurrenceType } from '@/types/planner';

const FILTERS: PlannerFilter[] = [
  'today',
  'tomorrow',
  'week',
  'month',
  'overdue',
  'pending',
  'completed',
  'all',
];

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDaySummaries(occurrences: TaskOccurrence[]): CalendarDaySummary[] {
  const map = new Map<string, CalendarDaySummary>();
  for (const item of occurrences) {
    const current = map.get(item.dateKey) ?? {
      date: item.dateKey,
      total: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
      skipped: 0,
    };
    current.total += 1;
    if (item.status === 'OVERDUE') current.overdue += 1;
    else if (item.status === 'COMPLETED') current.completed += 1;
    else if (item.status === 'PENDING') current.pending += 1;
    map.set(item.dateKey, current);
  }
  return [...map.values()];
}

export function PlannerPage() {
  const { t } = useTranslation();
  const initial = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<PlannerFilter>('today');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<TaskRecurrenceType>('DAILY');
  const [intervalDays, setIntervalDays] = useState(3);
  const [dueDate, setDueDate] = useState(todayKey());
  const [calYear, setCalYear] = useState(initial.getFullYear());
  const [calMonth, setCalMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());

  const listQuery = usePlannerOccurrences(filter, filterCategoryId || undefined);
  const monthQuery = usePlannerOccurrences(
    'month',
    filterCategoryId || undefined,
    calYear,
    calMonth,
  );
  const occurrencesQuery = viewMode === 'calendar' ? monthQuery : listQuery;
  const categoriesQuery = usePlannerCategories();
  const statsQuery = usePlannerStatistics();
  const createTask = useCreatePlannerTask();
  const createCategory = useCreateTaskCategory();
  const complete = useCompleteOccurrence();
  const reschedule = useRescheduleOccurrence();
  const remove = useRemoveOccurrence();
  const updateRecurrence = useUpdateTaskRecurrence();

  const stats = statsQuery.data;
  const canSubmit = title.trim().length > 0 && dueDate.length > 0 && !createTask.isPending;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    await createTask.mutateAsync({
      title: title.trim(),
      categoryId: formCategoryId || null,
      recurrenceType,
      intervalDays: recurrenceType === 'CUSTOM_DAYS' ? intervalDays : null,
      dueDate,
    });
    setTitle('');
  }

  const weekdayLabel = useMemo(
    () => (weekday: number) => t(`planner.weekdays.${WEEKDAYS[weekday]}`),
    [t],
  );

  const occurrences = occurrencesQuery.data?.occurrences ?? [];
  const calendarDays = useMemo(() => buildDaySummaries(occurrences), [occurrences]);
  const selectedOccurrences = useMemo(
    () => (selectedDate ? occurrences.filter((item) => item.dateKey === selectedDate) : []),
    [occurrences, selectedDate],
  );

  if (occurrencesQuery.isLoading) return <Loader />;
  if (occurrencesQuery.isError) return <ErrorMessage message={t('auth.errors.generic')} />;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('planner.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('planner.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('list')}
          >
            {t('planner.listView')}
          </Button>
          <Button
            type="button"
            variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('calendar')}
          >
            {t('planner.calendarView')}
          </Button>
          <Link
            to="/planner/overdue"
            className="inline-flex items-center text-sm font-semibold text-brand-500 no-underline hover:underline"
          >
            {t('planner.openOverdue')}
          </Link>
        </div>
      </section>

      {stats ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('planner.stats.total')} value={stats.totalTasks} />
          <Stat label={t('planner.stats.completed')} value={stats.completedOccurrences} />
          <Stat label={t('planner.stats.overdue')} value={stats.overdueOccurrences} />
          <Stat label={t('planner.stats.streak')} value={stats.streak} />
        </section>
      ) : null}

      <form
        onSubmit={(e) => void onCreate(e)}
        className="space-y-3 rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line"
      >
        <h2 className="text-sm font-semibold text-ink">{t('planner.createTitle')}</h2>
        <Input
          label={t('planner.fields.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t('planner.actions.changeRecurrence')}
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as TaskRecurrenceType)}
            options={[
              { value: 'DAILY', label: t('planner.recurrence.DAILY') },
              { value: 'WEEKLY', label: t('planner.recurrence.WEEKLY') },
              { value: 'MONTHLY', label: t('planner.recurrence.MONTHLY') },
              { value: 'CUSTOM_DAYS', label: t('planner.recurrence.CUSTOM_DAYS') },
            ]}
          />
          {recurrenceType === 'CUSTOM_DAYS' ? (
            <Input
              label={t('planner.recurrence.CUSTOM_DAYS')}
              type="number"
              min={1}
              max={365}
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
            />
          ) : (
            <Input
              label={t('budget.fields.date')}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          )}
        </div>
        {recurrenceType === 'CUSTOM_DAYS' ? (
          <Input
            label={t('budget.fields.date')}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        ) : null}
        <Select
          label={t('planner.fields.category')}
          value={formCategoryId}
          onChange={(e) => setFormCategoryId(e.target.value)}
          placeholder={t('planner.fields.noCategory')}
          options={(categoriesQuery.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label={t('categories.createTitle')}
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
                setFormCategoryId(result.category.id);
                setNewCategoryName('');
              });
            }}
          >
            {t('categories.create')}
          </Button>
        </div>
        <Button type="submit" disabled={!canSubmit}>
          {createTask.isPending ? t('common.loading') : t('planner.create')}
        </Button>
      </form>

      <Select
        label={t('materials.filters.category')}
        value={filterCategoryId}
        onChange={(e) => setFilterCategoryId(e.target.value)}
        placeholder={t('materials.filters.allCategories')}
        options={(categoriesQuery.data ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      />

      {viewMode === 'list' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  filter === item
                    ? 'bg-brand-100 text-brand-500'
                    : 'bg-panel text-muted ring-1 ring-line hover:text-ink'
                }`}
              >
                {t(`planner.filters.${item}`)}
              </button>
            ))}
          </div>

          {occurrences.length === 0 ? (
            <EmptyState title={t('planner.emptyTitle')} description={t('planner.emptyDescription')} />
          ) : (
            <OccurrenceList
              occurrences={occurrences}
              weekdayLabel={weekdayLabel}
              onComplete={(id) => void complete.mutateAsync(id)}
              onReschedule={(id, dateKey) => {
                const next = window.prompt(t('planner.actions.reschedulePrompt'), dateKey);
                if (next) void reschedule.mutateAsync({ id, dueDate: next });
              }}
              onChangeRecurrence={(item) => {
                const next = window.prompt(
                  t('planner.actions.recurrencePrompt'),
                  item.task.recurrenceType,
                ) as TaskRecurrenceType | null;
                if (next && ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'].includes(next)) {
                  void updateRecurrence.mutateAsync({
                    id: item.task.id,
                    recurrenceType: next,
                    intervalDays: next === 'CUSTOM_DAYS' ? item.task.intervalDays ?? 3 : null,
                  });
                }
              }}
              onRemove={(id) => void remove.mutateAsync(id)}
              completePending={complete.isPending}
            />
          )}
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Calendar
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            days={calendarDays}
            onMonthChange={(year, month) => {
              setCalYear(year);
              setCalMonth(month);
            }}
            onSelectDate={setSelectedDate}
          />
          <section className="space-y-3 rounded-2xl bg-panel p-4 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-ink">
              {selectedDate ?? t('calendar.pickDay')}
            </h2>
            {selectedOccurrences.length === 0 ? (
              <p className="text-sm text-muted">{t('planner.calendarEmpty')}</p>
            ) : (
              <OccurrenceList
                occurrences={selectedOccurrences}
                weekdayLabel={weekdayLabel}
                onComplete={(id) => void complete.mutateAsync(id)}
                onReschedule={(id, dateKey) => {
                  const next = window.prompt(t('planner.actions.reschedulePrompt'), dateKey);
                  if (next) void reschedule.mutateAsync({ id, dueDate: next });
                }}
                onChangeRecurrence={(item) => {
                  const next = window.prompt(
                    t('planner.actions.recurrencePrompt'),
                    item.task.recurrenceType,
                  ) as TaskRecurrenceType | null;
                  if (next && ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'].includes(next)) {
                    void updateRecurrence.mutateAsync({
                      id: item.task.id,
                      recurrenceType: next,
                      intervalDays: next === 'CUSTOM_DAYS' ? item.task.intervalDays ?? 3 : null,
                    });
                  }
                }}
                onRemove={(id) => void remove.mutateAsync(id)}
                completePending={complete.isPending}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function OccurrenceList({
  occurrences,
  weekdayLabel,
  onComplete,
  onReschedule,
  onChangeRecurrence,
  onRemove,
  completePending,
}: {
  occurrences: TaskOccurrence[];
  weekdayLabel: (weekday: number) => string;
  onComplete: (id: string) => void;
  onReschedule: (id: string, dateKey: string) => void;
  onChangeRecurrence: (item: TaskOccurrence) => void;
  onRemove: (id: string) => void;
  completePending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ul className="space-y-3">
      {occurrences.map((item) => (
        <li key={item.id} className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{item.task.title}</p>
              <p className="mt-1 text-sm text-muted">
                {item.dateKey} · {weekdayLabel(item.weekday)} ·{' '}
                {t(`planner.recurrence.${item.task.recurrenceType}`)}
                {item.task.category ? ` · ${item.task.category.name}` : ''}
              </p>
              {item.daysOverdue > 0 ? (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {t('planner.daysOverdue', { count: item.daysOverdue })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.status !== 'COMPLETED' ? (
                <Button type="button" onClick={() => onComplete(item.id)} disabled={completePending}>
                  {t('planner.actions.complete')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => onReschedule(item.id, item.dateKey)}
              >
                {t('planner.actions.reschedule')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onChangeRecurrence(item)}>
                {t('planner.actions.changeRecurrence')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onRemove(item.id)}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export function PlannerOverduePage() {
  const { t } = useTranslation();
  const query = usePlannerOccurrences('overdue');
  const complete = useCompleteOccurrence();
  const reschedule = useRescheduleOccurrence();
  const remove = useRemoveOccurrence();

  if (query.isLoading) return <Loader />;
  if (query.isError) return <ErrorMessage message={t('auth.errors.generic')} />;

  const occurrences = query.data?.occurrences ?? [];

  return (
    <div className="space-y-6">
      <section>
        <Link to="/planner" className="text-sm text-brand-500 no-underline hover:underline">
          {t('common.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">{t('planner.overdueTitle')}</h1>
        <p className="mt-1 text-sm text-muted">{t('planner.overdueSubtitle')}</p>
      </section>

      {occurrences.length === 0 ? (
        <EmptyState
          title={t('planner.overdueEmptyTitle')}
          description={t('planner.overdueEmptyDescription')}
        />
      ) : (
        <ul className="space-y-3">
          {occurrences.map((item) => (
            <li key={item.id} className="rounded-2xl bg-panel p-4 ring-1 ring-line">
              <p className="font-semibold text-ink">{item.task.title}</p>
              <p className="mt-1 text-sm text-muted">
                {item.dateKey} · {t(`planner.weekdays.${WEEKDAYS[item.weekday]}`)}
              </p>
              <p className="mt-1 text-sm font-medium text-red-600">
                {t('planner.daysOverdue', { count: item.daysOverdue })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" onClick={() => void complete.mutateAsync(item.id)}>
                  {t('planner.actions.complete')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = window.prompt(t('planner.actions.reschedulePrompt'), todayKey());
                    if (next) void reschedule.mutateAsync({ id: item.id, dueDate: next });
                  }}
                >
                  {t('planner.actions.reschedule')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void remove.mutateAsync(item.id)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
