import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateHabit,
  useHabits,
  useRemoveHabit,
  useToggleHabit,
} from '@/features/habits/useHabits';

export function HabitsPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const habitsQuery = useHabits();
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabit();
  const removeHabit = useRemoveHabit();

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await createHabit.mutateAsync(title.trim());
    setTitle('');
  }

  if (habitsQuery.isLoading) return <Loader />;
  if (habitsQuery.isError || !habitsQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { habits, stats } = habitsQuery.data;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('habits.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('habits.subtitle')}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('habits.stats.active')} value={stats.activeHabits} />
        <Stat label={t('habits.stats.today')} value={stats.completedToday} />
        <Stat label={t('habits.stats.rate')} value={`${stats.completionRateToday}%`} />
        <Stat label={t('habits.stats.streak')} value={stats.streak} />
      </section>

      <form
        onSubmit={(e) => void onCreate(e)}
        className="flex flex-col gap-3 rounded-2xl bg-panel p-4 ring-1 ring-line sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label={t('habits.fields.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!title.trim() || createHabit.isPending}>
          {t('habits.create')}
        </Button>
      </form>

      {habits.length === 0 ? (
        <EmptyState title={t('habits.emptyTitle')} description={t('habits.emptyDescription')} />
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-panel p-4 ring-1 ring-line"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={habit.completedToday}
                  onChange={(e) =>
                    void toggleHabit.mutateAsync({
                      id: habit.id,
                      completed: e.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-[var(--color-brand-500)]"
                />
                <span
                  className={`truncate text-base font-medium ${
                    habit.completedToday ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  {habit.title}
                </span>
              </label>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void removeHabit.mutateAsync(habit.id)}
              >
                {t('common.delete')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
