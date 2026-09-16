import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Calendar } from '@/components/Calendar';
import { WaterGlasses } from '@/components/nutrition/WaterGlasses';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  useCreateMeal,
  useDeleteMeal,
  useNutritionPeriod,
  useSetWater,
  useUpdateNutritionSettings,
} from '@/features/nutrition/useNutrition';
import type { CalendarDaySummary } from '@/types/calendar';
import { toDateInputValue } from '@/utils/date';

function currentDefaults() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: toDateInputValue(),
  };
}

export function CaloriesPage() {
  const { t } = useTranslation();
  const defaults = useMemo(() => currentDefaults(), []);
  const [year, setYear] = useState(defaults.year);
  const [month, setMonth] = useState(defaults.month);
  const [selectedDate, setSelectedDate] = useState(defaults.date);
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [calorieGoalInput, setCalorieGoalInput] = useState('');
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const periodQuery = useNutritionPeriod(year, month);
  const updateSettings = useUpdateNutritionSettings();
  const createMeal = useCreateMeal();
  const deleteMeal = useDeleteMeal();
  const setWater = useSetWater();

  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y !== year || m !== month) {
      setSelectedDate(`${year}-${String(month).padStart(2, '0')}-01`);
    }
  }, [year, month, selectedDate]);

  useEffect(() => {
    if (!periodQuery.data) return;
    setCalorieGoalInput(String(periodQuery.data.settings.calorieGoal));
    setWaterGoalInput(String(periodQuery.data.settings.waterGoal));
  }, [periodQuery.data]);

  if (periodQuery.isLoading) return <Loader />;
  if (periodQuery.isError || !periodQuery.data) {
    const unavailable =
      periodQuery.error instanceof ApiError &&
      (periodQuery.error.status === 404 || periodQuery.error.code === 'NUTRITION_UNAVAILABLE');
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-ink">{t('calories.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('calories.subtitle')}</p>
        </section>
        <ErrorMessage
          message={unavailable ? t('calories.errors.unavailable') : t('auth.errors.generic')}
        />
      </div>
    );
  }

  const { settings, meals, water, days } = periodQuery.data;
  const dayMeals = meals.filter((meal) => meal.date === selectedDate);
  const eaten = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const glasses = water.find((row) => row.date === selectedDate)?.glasses ?? 0;
  const overeating = eaten > settings.calorieGoal;
  const remaining = settings.calorieGoal - eaten;
  const caloriePercent = Math.min(100, Math.round((eaten / Math.max(settings.calorieGoal, 1)) * 100));
  const waterPercent = Math.min(100, Math.round((glasses / Math.max(settings.waterGoal, 1)) * 100));

  const calendarDays: CalendarDaySummary[] = days.map((day) => ({
    date: day.date,
    total: day.mealCount,
    overdue: day.overeating ? 1 : 0,
    completed: !day.overeating && day.mealCount > 0 ? day.mealCount : 0,
    pending: 0,
    skipped: 0,
  }));

  const onSaveCalorieGoal = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const calorieGoal = Number(calorieGoalInput);
    if (!Number.isFinite(calorieGoal) || calorieGoal < 500) {
      setFormError(t('calories.errors.calorieGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ calorieGoal });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onSaveWaterGoal = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const waterGoal = Number(waterGoalInput);
    if (!Number.isFinite(waterGoal) || waterGoal < 1) {
      setFormError(t('calories.errors.waterGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ waterGoal });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onAddMeal = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const calories = Number(kcal);
    if (!title.trim()) {
      setFormError(t('calories.errors.title'));
      return;
    }
    if (!Number.isFinite(calories) || calories < 1) {
      setFormError(t('calories.errors.calories'));
      return;
    }
    try {
      await createMeal.mutateAsync({
        title: title.trim(),
        calories,
        date: selectedDate,
      });
      setTitle('');
      setKcal('');
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onDeleteMeal = async (id: string) => {
    setBusyId(id);
    setFormError(null);
    try {
      await deleteMeal.mutateAsync(id);
    } catch {
      setFormError(t('auth.errors.generic'));
    } finally {
      setBusyId(null);
    }
  };

  const onWaterChange = async (next: number) => {
    setFormError(null);
    try {
      await setWater.mutateAsync({ date: selectedDate, glasses: next });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('calories.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('calories.subtitle')}</p>
      </section>

      <Calendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        days={calendarDays}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          const today = toDateInputValue();
          const [todayYear, todayMonth] = today.split('-').map(Number);
          if (todayYear === nextYear && todayMonth === nextMonth) {
            setSelectedDate(today);
          }
        }}
        onSelectDate={setSelectedDate}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
            {t('calories.dayTitle', { date: selectedDate })}
          </h2>
          {overeating ? <Badge tone="danger">{t('calories.overeating')}</Badge> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
            <h3 className="text-base font-semibold text-ink">{t('calories.caloriesTitle')}</h3>

            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void onSaveCalorieGoal(event)}>
              <Input
                label={t('calories.calorieGoal')}
                type="number"
                min="500"
                max="10000"
                value={calorieGoalInput}
                onChange={(event) => setCalorieGoalInput(event.target.value)}
              />
              <Button type="submit" isLoading={updateSettings.isPending} className="w-full sm:w-auto">
                {t('calories.saveGoals')}
              </Button>
            </form>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('calories.statEaten'), value: `${eaten} ${t('calories.kcal')}` },
                { label: t('calories.statGoal'), value: `${settings.calorieGoal} ${t('calories.kcal')}` },
                {
                  label: overeating ? t('calories.statOver') : t('calories.statLeft'),
                  value: `${Math.abs(remaining)} ${t('calories.kcal')}`,
                },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl bg-brand-50/40 p-3 ring-1 ring-line">
                  <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{card.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink sm:text-base">{card.value}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">{t('calories.progress')}</span>
                <span className={overeating ? 'font-semibold text-red-500' : 'font-semibold text-ink'}>
                  {eaten} / {settings.calorieGoal} {t('calories.kcal')}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/70">
                <div
                  className={`h-full rounded-full ${overeating ? 'bg-red-500' : 'bg-brand-500'}`}
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink">{t('calories.addMeal')}</h4>
              <form
                className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_auto]"
                onSubmit={(event) => void onAddMeal(event)}
              >
                <Input
                  label={t('calories.mealTitle')}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t('calories.mealPlaceholder')}
                  autoComplete="off"
                />
                <Input
                  label={t('calories.mealCalories')}
                  type="number"
                  min="1"
                  max="10000"
                  value={kcal}
                  onChange={(event) => setKcal(event.target.value)}
                />
                <div className="flex items-end">
                  <Button type="submit" isLoading={createMeal.isPending} className="w-full sm:w-auto">
                    {t('calories.saveMeal')}
                  </Button>
                </div>
              </form>
            </div>

            <ul className="space-y-2">
              {dayMeals.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  {t('calories.emptyMeals')}
                </li>
              ) : (
                dayMeals.map((meal) => (
                  <li
                    key={meal.id}
                    className="flex items-center gap-3 rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{meal.title}</p>
                    <span className="shrink-0 text-sm tabular-nums text-muted">
                      {meal.calories} {t('calories.kcal')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyId === meal.id || deleteMeal.isPending}
                      onClick={() => void onDeleteMeal(meal.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="space-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
            <div>
              <h3 className="text-base font-semibold text-ink">{t('calories.waterTitle')}</h3>
              <p className="mt-1 text-sm text-muted">{t('calories.waterHint')}</p>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void onSaveWaterGoal(event)}>
              <Input
                label={t('calories.waterGoal')}
                type="number"
                min="1"
                max="20"
                value={waterGoalInput}
                onChange={(event) => setWaterGoalInput(event.target.value)}
              />
              <Button type="submit" isLoading={updateSettings.isPending} className="w-full sm:w-auto">
                {t('calories.saveGoals')}
              </Button>
            </form>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">{t('calories.waterProgress')}</span>
                <span className="font-semibold text-ink">
                  {glasses} / {settings.waterGoal} {t('calories.glasses')}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${waterPercent}%` }} />
              </div>
            </div>

            <WaterGlasses
              glasses={glasses}
              goal={settings.waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => void onWaterChange(next)}
            />
          </section>
        </div>

        <ErrorMessage message={formError ?? undefined} />
      </section>
    </div>
  );
}
