import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateHabit,
  useDeleteHabit,
  useRhythmPeriod,
  useSetHabitCheck,
  useUpdateHabit,
} from '@/features/rhythm/useRhythm';
import type { AppLanguage } from '@/i18n';
import { formatMonthTitle, weekdayShort } from '@/utils/date';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function RhythmPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const periodQuery = useRhythmPeriod(year, month);
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const setCheck = useSetHabitCheck();

  const today = periodQuery.data?.today ?? dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const daysInMonth = periodQuery.data?.daysInMonth ?? new Date(year, month, 0).getDate();
  const habits = periodQuery.data?.habits ?? [];
  const cycleDays = periodQuery.data?.cycleDays ?? 30;

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          day,
          date: dateKey(year, month, day),
          weekday: weekdayShort(year, month, day, language),
        };
      }),
    [daysInMonth, language, month, year],
  );

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

  const onRename = async (id: string) => {
    const next = editingTitle.trim();
    setEditingId(null);
    if (!next || next === habits.find((habit) => habit.id === id)?.title) return;
    try {
      await updateHabit.mutateAsync({ id, title: next });
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

  if (periodQuery.isLoading) {
    return <Loader />;
  }

  if (periodQuery.isError) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('rhythm.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('rhythm.subtitle', { days: cycleDays })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => shiftMonth(-1)} className="!w-auto !px-3">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t('rhythm.prevMonth')}</span>
          </Button>
          <p className="min-w-40 text-center text-sm font-semibold capitalize text-ink">
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
          <div key={card.label} className="rounded-2xl bg-panel p-3 shadow-sm ring-1 ring-line">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </section>

      <form className="max-w-xl" onSubmit={(event) => void onAdd(event)}>
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

      <section className="overflow-hidden rounded-3xl bg-panel shadow-sm ring-1 ring-line">
        {habits.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted">{t('rhythm.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-20 min-w-48 bg-panel px-4 py-3 text-left font-medium text-muted">
                    {t('rhythm.habit')}
                  </th>
                  {days.map((item) => {
                    const isToday = item.date === today;
                    return (
                      <th
                        key={item.date}
                        className={`min-w-9 px-0.5 py-2 text-center font-medium ${
                          isToday ? 'text-brand-500' : 'text-muted'
                        }`}
                      >
                        <span className="block text-[10px] uppercase">{item.weekday}</span>
                        <span className="block text-xs">{item.day}</span>
                      </th>
                    );
                  })}
                  <th className="min-w-16 px-3 py-3 text-right font-medium text-muted">{t('rhythm.monthCol')}</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const checkSet = new Set(habit.checks);
                  const percent = Math.round((habit.done / Math.max(habit.target, 1)) * 100);
                  return (
                    <tr key={habit.id} className="border-b border-line/80 last:border-0">
                      <td className="sticky left-0 z-10 bg-panel px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {editingId === habit.id ? (
                            <input
                              className="w-full rounded-lg border border-brand-400 bg-panel px-2 py-1 text-sm text-ink outline-none"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onBlur={() => void onRename(habit.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  void onRename(habit.id);
                                }
                                if (event.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              className="min-w-0 flex-1 truncate text-left font-medium text-ink"
                              onClick={() => {
                                setEditingId(habit.id);
                                setEditingTitle(habit.title);
                              }}
                            >
                              {habit.title}
                            </button>
                          )}
                          {habit.formed ? <Badge>{t('rhythm.formed')}</Badge> : null}
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-muted transition hover:bg-brand-50 hover:text-ink"
                            aria-label={t('common.delete')}
                            onClick={() => void deleteHabit.mutateAsync(habit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {t('rhythm.streak', { count: habit.streak })} · {habit.lifetime}/{cycleDays}
                        </p>
                      </td>
                      {days.map((item) => {
                        const done = checkSet.has(item.date);
                        const future = item.date > today;
                        return (
                          <td key={item.date} className="px-0.5 py-2 text-center">
                            <button
                              type="button"
                              disabled={future || setCheck.isPending}
                              aria-pressed={done}
                              aria-label={`${habit.title} ${item.date}`}
                              onClick={() => void onToggle(habit.id, item.date, done)}
                              className={`mx-auto block h-7 w-7 rounded-lg transition ${
                                done
                                  ? 'bg-brand-500 shadow-sm'
                                  : future
                                    ? 'bg-line/30'
                                    : item.date === today
                                      ? 'bg-brand-50 ring-2 ring-brand-500/70 hover:bg-brand-100'
                                      : 'bg-line/55 hover:bg-brand-200'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums text-muted">
                        {habit.done}/{habit.target}
                        <span className="mt-0.5 block text-[11px] font-medium text-brand-500">{percent}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ErrorMessage message={formError ?? undefined} />
    </div>
  );
}
