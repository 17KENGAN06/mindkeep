import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import type { PlannerFilter, TaskRecurrenceType } from '@/types/planner';

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

export function PlannerPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PlannerFilter>('today');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<TaskRecurrenceType>('DAILY');
  const [intervalDays, setIntervalDays] = useState(3);
  const [dueDate, setDueDate] = useState(todayKey());

  const occurrencesQuery = usePlannerOccurrences(filter, filterCategoryId || undefined);
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

  async function onCreateCategory(event: FormEvent) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    const result = await createCategory.mutateAsync(newCategoryName.trim());
    setFormCategoryId(result.category.id);
    setNewCategoryName('');
  }

  const weekdayLabel = useMemo(
    () => (weekday: number) => t(`planner.weekdays.${WEEKDAYS[weekday]}`),
    [t],
  );

  if (occurrencesQuery.isLoading) return <Loader />;
  if (occurrencesQuery.isError) return <ErrorMessage message={t('auth.errors.generic')} />;

  const occurrences = occurrencesQuery.data?.occurrences ?? [];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('planner.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('planner.subtitle')}</p>
        </div>
        <Link
          to="/planner/overdue"
          className="text-sm font-semibold text-brand-500 no-underline hover:underline"
        >
          {t('planner.openOverdue')}
        </Link>
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
          label={t('planner.fields.noCategory')}
          value={formCategoryId}
          onChange={(e) => setFormCategoryId(e.target.value)}
          placeholder={t('planner.fields.noCategory')}
          options={(categoriesQuery.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <form
          onSubmit={(e) => void onCreateCategory(e)}
          className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <Input
            label={t('categories.createTitle')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!newCategoryName.trim() || createCategory.isPending}>
            {t('categories.create')}
          </Button>
        </form>
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
                    <Button
                      type="button"
                      onClick={() => void complete.mutateAsync(item.id)}
                      disabled={complete.isPending}
                    >
                      {t('planner.actions.complete')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const next = window.prompt(
                        t('planner.actions.reschedulePrompt'),
                        item.dateKey,
                      );
                      if (next) void reschedule.mutateAsync({ id: item.id, dueDate: next });
                    }}
                  >
                    {t('planner.actions.reschedule')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const next = window.prompt(
                        t('planner.actions.recurrencePrompt'),
                        item.task.recurrenceType,
                      ) as TaskRecurrenceType | null;
                      if (
                        next &&
                        ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS'].includes(next)
                      ) {
                        void updateRecurrence.mutateAsync({
                          id: item.task.id,
                          recurrenceType: next,
                          intervalDays:
                            next === 'CUSTOM_DAYS' ? item.task.intervalDays ?? 3 : null,
                        });
                      }
                    }}
                  >
                    {t('planner.actions.changeRecurrence')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void remove.mutateAsync(item.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
