import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { HabitMonthCard } from '@/components/habits/HabitMonthCard';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateHabit,
  useDeleteHabit,
  usePrefetchRhythmNeighbors,
  useRhythmPeriod,
  useSetHabitCheck,
  useUpdateHabit,
} from '@/features/rhythm/useRhythm';
import type { AppLanguage } from '@/i18n';
import type { RhythmHabit } from '@/types/rhythm';
import { formatMonthTitle } from '@/utils/date';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function habitsForMonth(habits: RhythmHabit[], year: number, month: number, ready: boolean): RhythmHabit[] {
  if (ready) return habits;
  const target = new Date(year, month, 0).getDate();
  return habits.map((habit) => ({ ...habit, checks: [], done: 0, target }));
}

export function RhythmPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const periodQuery = useRhythmPeriod(year, month);
  usePrefetchRhythmNeighbors(year, month);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const setCheck = useSetHabitCheck();

  const today = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const periodReady = periodQuery.data?.year === year && periodQuery.data?.month === month;
  const habits = habitsForMonth(periodQuery.data?.habits ?? [], year, month, periodReady);
  const cycleDays = periodQuery.data?.cycleDays ?? 30;

  const todayDone = habits.filter((habit) => habit.checks.includes(today)).length;
  const monthPercent =
    habits.length === 0
      ? 0
      : Math.round(
          (habits.reduce((sum, habit) => sum + habit.done / Math.max(habit.target, 1), 0) / habits.length) *
            100,
        );

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const onAdd = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const next = title.trim();
    if (!next) {
      setFormError(t('rhythm.errors.title'));
      return;
    }
    try {
      await createHabit.mutateAsync(next);
      setTitle('');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t('auth.errors.generic'));
    }
  };

  const onRename = async (id: string, nextTitle: string) => {
    try {
      await updateHabit.mutateAsync({ id, title: nextTitle });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t('auth.errors.generic'));
    }
  };

  const onToggle = async (habitId: string, date: string, done: boolean) => {
    if (date > today) return;
    setFormError(null);
    try {
      await setCheck.mutateAsync({ habitId, date, done: !done });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t('auth.errors.generic'));
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink">{t('rhythm.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('rhythm.subtitle', { days: cycleDays })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => shiftMonth(-1)} className="!w-auto !px-3">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t('rhythm.prevMonth')}</span>
          </Button>
          <p className="min-w-36 text-center text-sm font-semibold capitalize text-ink">
            {formatMonthTitle(year, month, language)}
          </p>
          <Button type="button" variant="secondary" onClick={() => shiftMonth(1)} className="!w-auto !px-3">
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t('rhythm.nextMonth')}</span>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('rhythm.statHabits'), value: String(habits.length) },
          { label: t('rhythm.statToday'), value: habits.length === 0 ? '—' : `${todayDone} / ${habits.length}` },
          { label: t('rhythm.statMonth'), value: `${monthPercent}%` },
          {
            label: t('rhythm.statFormed'),
            value: String(habits.filter((habit) => habit.formed).length),
          },
        ].map((card) => (
          <div key={card.label} className="min-w-0 rounded-2xl bg-panel p-3 shadow-sm ring-1 ring-line">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </section>

      <form className="w-full min-w-0 max-w-3xl" onSubmit={(event) => void onAdd(event)}>
        <Input
          label={t('rhythm.addLabel')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('rhythm.addPlaceholder')}
          autoComplete="off"
          hint={t('rhythm.addHint')}
          action={
            <Button type="submit" isLoading={createHabit.isPending} className="w-full sm:!w-44">
              {t('rhythm.add')}
            </Button>
          }
        />
      </form>

      <ErrorMessage message={formError ?? (periodQuery.isError && !periodQuery.data ? t('auth.errors.generic') : undefined)} />

      {periodQuery.isPending && !periodQuery.data ? (
        <Loader />
      ) : habits.length === 0 ? (
        <section className="rounded-3xl bg-panel px-5 py-16 text-center text-sm text-muted shadow-sm ring-1 ring-line">
          {t('rhythm.empty')}
        </section>
      ) : (
        <section
          className={`grid min-w-0 gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${
            periodReady ? 'opacity-100' : 'opacity-60'
          }`}
        >
          {habits.map((habit) => (
            <HabitMonthCard
              key={habit.id}
              habit={habit}
              year={year}
              month={month}
              today={today}
              cycleDays={cycleDays}
              language={language}
              busy={setCheck.isPending || !periodReady}
              onToggle={(date, done) => void onToggle(habit.id, date, done)}
              onRename={(nextTitle) => void onRename(habit.id, nextTitle)}
              onDelete={() => void deleteHabit.mutateAsync(habit.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
