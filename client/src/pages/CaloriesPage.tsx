import { Calculator } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { Calendar } from '@/components/Calendar';
import { WaterGlasses } from '@/components/nutrition/WaterGlasses';
import { WeightTrendChart } from '@/components/nutrition/WeightTrendChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { mutationErrorMessage, isProAccount } from '@/features/billing/planLimit';
import { PlanRemain } from '@/components/billing/PlanRemain';
import { CalorieHelperDialog } from '@/features/nutrition/CalorieHelperDialog';
import { MacroTotals } from '@/features/nutrition/MacroTotals';
import { MealMacrosFields, emptyMacroDraft, parseMacroDraft, type MacroDraft } from '@/features/nutrition/MealMacrosFields';
import { FoodScanMeal } from '@/features/nutrition/FoodScanMeal';
import { MealKindPicker } from '@/features/nutrition/MealKindPicker';
import { MealRow } from '@/features/nutrition/MealRow';
import { StepsCheck } from '@/features/nutrition/StepsCheck';
import { canTrackSteps, StepsMonthGrid } from '@/features/nutrition/StepsMonthGrid';
import { type MealKind } from '@/features/nutrition/mealKinds';
import { useAuth } from '@/features/auth/useAuth';
import {
  useCreateMeal,
  useDeleteMeal,
  useNutritionPeriod,
  useSetSteps,
  useSetWater,
  useSetWeight,
  useUpdateNutritionSettings,
} from '@/features/nutrition/useNutrition';
import type { CalendarDaySummary } from '@/types/calendar';
import { useAccountToday, useTodayRollover } from '@/features/time/useAccountToday';
import { dateKeyInZone } from '@/utils/date';

function formatKg(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function parseKg(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 20 || parsed > 400) return null;
  return Math.round(parsed * 10) / 10;
}

function yearMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function CaloriesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pro = isProAccount(user);
  const { today: accountToday, timeZone, year: accountYear, month: accountMonth } = useAccountToday();
  const [year, setYear] = useState(accountYear);
  const [month, setMonth] = useState(accountMonth);
  const [selectedDate, setSelectedDate] = useState(accountToday);
  // At midnight, move along only if the user was still looking at the old "today".
  useTodayRollover(accountToday, (previous, next) => {
    if (selectedDate !== previous) return;
    setSelectedDate(next);
    setYear(Number(next.slice(0, 4)));
    setMonth(Number(next.slice(5, 7)));
  });
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [mealKind, setMealKind] = useState<MealKind | null>(null);
  const [calorieGoalInput, setCalorieGoalInput] = useState('');
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [stepsGoalInput, setStepsGoalInput] = useState('');
  const [weightGoalInput, setWeightGoalInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [helperOpen, setHelperOpen] = useState(false);
  const [macroDraft, setMacroDraft] = useState<MacroDraft>(() => emptyMacroDraft());

  const periodQuery = useNutritionPeriod(year, month);
  const updateSettings = useUpdateNutritionSettings();
  const createMeal = useCreateMeal();
  const deleteMeal = useDeleteMeal();
  const setWater = useSetWater();
  const setSteps = useSetSteps();
  const setWeight = useSetWeight();

  // Keep the selected day inside the shown month (adjusted during render, before paint).
  {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y !== year || m !== month) {
      setSelectedDate(`${year}-${String(month).padStart(2, '0')}-01`);
    }
  }

  // Re-seed the goal inputs whenever fresh period data arrives.
  const [goalsSeededFrom, setGoalsSeededFrom] = useState<typeof periodQuery.data>(undefined);
  if (periodQuery.data && periodQuery.data !== goalsSeededFrom) {
    setGoalsSeededFrom(periodQuery.data);
    setCalorieGoalInput(String(periodQuery.data.settings.calorieGoal));
    setWaterGoalInput(String(periodQuery.data.settings.waterGoal));
    setStepsGoalInput(String(periodQuery.data.settings.stepsGoal ?? 10000));
    setWeightGoalInput(
      periodQuery.data.settings.weightGoal == null
        ? ''
        : formatKg(periodQuery.data.settings.weightGoal),
    );
  }

  // Re-seed the weight input from the logged value when the data or the selected day changes.
  const [weightSeededFrom, setWeightSeededFrom] = useState<{ data: typeof periodQuery.data; date: string } | null>(null);
  if (weightSeededFrom?.data !== periodQuery.data || weightSeededFrom?.date !== selectedDate) {
    setWeightSeededFrom({ data: periodQuery.data, date: selectedDate });
    const logged = periodQuery.data?.weight?.find((row) => row.date === selectedDate)?.kg;
    setWeightInput(logged == null ? '' : formatKg(logged));
  }

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
          <PlanRemain feature="meals" />
        </section>
        <ErrorMessage
          message={unavailable ? t('calories.errors.unavailable') : t('auth.errors.generic')}
        />
      </div>
    );
  }

  const { settings, meals, water, days } = periodQuery.data;
  const weight = periodQuery.data.weight ?? [];
  const stepsDays = periodQuery.data.steps ?? [];
  const weightAvg = periodQuery.data.weightAvg ?? null;
  const dayMeals = meals.filter((meal) => meal.date === selectedDate);
  const eaten = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const glasses = water.find((row) => row.date === selectedDate)?.glasses ?? 0;
  const stepsGoal = settings.stepsGoal ?? 10000;
  const stepsDone = stepsDays.find((row) => row.date === selectedDate)?.done ?? false;
  const todayKey = accountToday;
  const joinKey = user?.createdAt ? dateKeyInZone(new Date(user.createdAt), timeZone) : todayKey;
  const daysInMonth = new Date(year, month, 0).getDate();
  const viewingCurrentMonth = todayKey.startsWith(`${yearMonthKey(year, month)}-`);
  const todayDay = Number(todayKey.slice(8, 10));
  const stepsDoneDates = new Set(stepsDays.filter((row) => row.done).map((row) => row.date));
  const stepsMonthDone = stepsDoneDates.size;
  const stepsLocked = !canTrackSteps(selectedDate, joinKey, todayKey);
  const dayWeight = weight.find((row) => row.date === selectedDate)?.kg ?? null;
  const overeating = eaten > settings.calorieGoal;
  const macrosEnabled = settings.macrosEnabled ?? false;
  const remaining = settings.calorieGoal - eaten;
  const caloriePercent = Math.min(100, Math.round((eaten / Math.max(settings.calorieGoal, 1)) * 100));
  const waterPercent = Math.min(100, Math.round((glasses / Math.max(settings.waterGoal, 1)) * 100));

  const calendarDays: CalendarDaySummary[] = days.map((day) => {
    const marked = day.mealCount > 0 || day.weightKg != null;
    return {
      date: day.date,
      total: day.mealCount > 0 ? day.mealCount : marked ? 1 : 0,
      overdue: day.overeating ? 1 : 0,
      completed: !day.overeating && marked ? Math.max(day.mealCount, 1) : 0,
      pending: 0,
      skipped: 0,
    };
  });

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

  const onSaveStepsGoal = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const next = Number(stepsGoalInput);
    if (!Number.isFinite(next) || next < 1000 || next > 100000) {
      setFormError(t('calories.errors.stepsGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ stepsGoal: Math.round(next) });
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
    if (pro && !mealKind) {
      setFormError(t('calories.errors.kind'));
      return;
    }
    const macros = macrosEnabled ? parseMacroDraft(macroDraft) : { protein: null, fat: null, carbs: null };
    if (!macros) {
      setFormError(t('calories.macros.invalid'));
      return;
    }
    try {
      await createMeal.mutateAsync({
        title: title.trim(),
        calories,
        date: selectedDate,
        ...(mealKind ? { kind: mealKind } : {}),
        ...(macros.protein == null ? {} : { protein: macros.protein }),
        ...(macros.fat == null ? {} : { fat: macros.fat }),
        ...(macros.carbs == null ? {} : { carbs: macros.carbs }),
      });
      setTitle('');
      setKcal('');
      setMealKind(null);
      setMacroDraft(emptyMacroDraft());
    } catch (error) {
      setFormError(mutationErrorMessage(error, t));
    }
  };

  const onToggleMacros = async () => {
    setFormError(null);
    try {
      await updateSettings.mutateAsync({ macrosEnabled: !macrosEnabled });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onApplyHelper = async (calories: number, targetWeightKg: number) => {
    setFormError(null);
    try {
      await updateSettings.mutateAsync({ calorieGoal: calories, weightGoal: targetWeightKg });
      setCalorieGoalInput(String(calories));
      setWeightGoalInput(formatKg(targetWeightKg));
      setHelperOpen(false);
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

  const onSaveWeightGoal = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const weightGoal = parseKg(weightGoalInput);
    if (weightGoal == null) {
      setFormError(t('calories.errors.weightGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ weightGoal });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onSaveWeight = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const kg = parseKg(weightInput);
    if (kg == null) {
      setFormError(t('calories.errors.weight'));
      return;
    }
    try {
      await setWeight.mutateAsync({ date: selectedDate, kg });
    } catch {
      setFormError(t('auth.errors.generic'));
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

  const onStepsChange = async (date: string, done: boolean) => {
    setFormError(null);
    try {
      await setSteps.mutateAsync({ date, done });
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('calories.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('calories.subtitle')}</p>
        <PlanRemain feature="meals" />
      </section>

      <Calendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        days={calendarDays}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          const today = accountToday;
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

            <div>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-brand-700 ring-1 ring-line/70 transition touch-manipulation hover:bg-brand-50 hover:ring-brand-400"
                onClick={() => setHelperOpen(true)}
              >
                <Calculator className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('calories.helper.open')}
              </button>
              <p className="mt-2 text-xs text-muted">{t('calories.helper.openHint')}</p>
            </div>

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

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{t('calories.macros.title')}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={macrosEnabled}
                  disabled={updateSettings.isPending}
                  className={`inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs font-semibold transition touch-manipulation disabled:opacity-50 ${
                    macrosEnabled
                      ? 'bg-brand-500 text-[#07110d]'
                      : 'text-muted ring-1 ring-line/70 hover:text-ink'
                  }`}
                  onClick={() => void onToggleMacros()}
                >
                  {macrosEnabled ? t('calories.macros.on') : t('calories.macros.off')}
                </button>
              </div>
              {macrosEnabled ? (
                <MacroTotals meals={dayMeals} />
              ) : (
                <p className="text-xs text-muted">{t('calories.macros.offHint')}</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink">{t('calories.addMeal')}</h4>
              <div className="mt-3">
                <FoodScanMeal date={selectedDate} macrosEnabled={macrosEnabled} />
              </div>
              <div className="mt-3">
                <MealKindPicker value={mealKind} pro={pro} onChange={setMealKind} />
              </div>
              <form className="mt-3 space-y-3" onSubmit={(event) => void onAddMeal(event)}>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
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
                </div>
                {macrosEnabled ? (
                  <MealMacrosFields idPrefix="meal-macros" value={macroDraft} onChange={setMacroDraft} />
                ) : null}
              </form>
            </div>

            <ul className="space-y-2">
              {dayMeals.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  {t('calories.emptyMeals')}
                </li>
              ) : (
                dayMeals.map((meal) => (
                  <MealRow
                    key={meal.id}
                    meal={meal}
                    busy={busyId === meal.id || deleteMeal.isPending}
                    showMacros={macrosEnabled}
                    onDelete={(id) => void onDeleteMeal(id)}
                  />
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
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${waterPercent}%` }} />
              </div>
            </div>

            <WaterGlasses
              glasses={glasses}
              goal={settings.waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => void onWaterChange(next)}
            />

            <div className="space-y-3 border-t border-line pt-4">
              <div>
                <h3 className="text-base font-semibold text-ink">{t('calories.stepsTitle')}</h3>
                <p className="mt-1 text-sm text-muted">{t('calories.stepsHint')}</p>
              </div>

              <form onSubmit={(event) => void onSaveStepsGoal(event)}>
                <Input
                  id="steps-goal"
                  label={t('calories.stepsGoal')}
                  type="number"
                  min="1000"
                  max="100000"
                  step="500"
                  value={stepsGoalInput}
                  onChange={(event) => setStepsGoalInput(event.target.value)}
                  action={
                    <Button type="submit" isLoading={updateSettings.isPending} className="w-full sm:!w-44">
                      {t('calories.saveGoals')}
                    </Button>
                  }
                />
              </form>

              <StepsCheck
                done={stepsDone}
                goal={stepsGoal}
                disabled={setSteps.isPending || stepsLocked}
                label={t('calories.stepsCheck')}
                hint={t('calories.stepsGoal')}
                onChange={(done) => void onStepsChange(selectedDate, done)}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">
                    {viewingCurrentMonth
                      ? t('calories.stepsDayOfMonth', { day: todayDay, days: daysInMonth })
                      : t('calories.stepsMonthLength', { days: daysInMonth })}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">
                    {t('calories.stepsMarked', { count: stepsMonthDone })}
                  </span>
                </div>
                <StepsMonthGrid
                  year={year}
                  month={month}
                  today={todayKey}
                  startedOn={joinKey}
                  doneDates={stepsDoneDates}
                  disabled={setSteps.isPending}
                  onToggle={(date, done) => void onStepsChange(date, done)}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div>
            <h3 className="text-base font-semibold text-ink">{t('calories.weightTitle')}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">{t('calories.weightGuide')}</p>
          </div>

          <form className="max-w-xl" onSubmit={(event) => void onSaveWeightGoal(event)}>
            <Input
              label={t('calories.weightGoal')}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={weightGoalInput}
              onChange={(event) => setWeightGoalInput(event.target.value)}
              hint={t('calories.weightDecimalHint')}
              action={
                <Button type="submit" isLoading={updateSettings.isPending} className="w-full sm:!w-44">
                  {t('calories.saveGoals')}
                </Button>
              }
            />
          </form>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: t('calories.weightToday'),
                value: dayWeight == null ? '—' : `${formatKg(dayWeight)} ${t('calories.kg')}`,
              },
              {
                label: t('calories.statAvg'),
                value: weightAvg == null ? '—' : `${formatKg(weightAvg)} ${t('calories.kg')}`,
              },
              {
                label: t('calories.statTarget'),
                value:
                  settings.weightGoal == null
                    ? '—'
                    : `${formatKg(settings.weightGoal)} ${t('calories.kg')}`,
              },
              (() => {
                if (dayWeight == null || settings.weightGoal == null) {
                  return { label: t('calories.statLeft'), value: '—' };
                }
                const delta = Number(formatKg(dayWeight - settings.weightGoal));
                if (Math.abs(delta) < 0.05) {
                  return { label: t('calories.statOnTarget'), value: `0 ${t('calories.kg')}` };
                }
                return {
                  label: delta > 0 ? t('calories.statToLose') : t('calories.statToGain'),
                  value: `${formatKg(Math.abs(delta))} ${t('calories.kg')}`,
                };
              })(),
            ].map((card) => (
              <div key={card.label} className="rounded-2xl bg-brand-50/40 p-3 ring-1 ring-line">
                <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{card.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink sm:text-base">{card.value}</p>
              </div>
            ))}
          </div>

          <WeightTrendChart
            points={periodQuery.data.weightTrend ?? weight}
            selectedDate={selectedDate}
            year={year}
            month={month}
            goalKg={settings.weightGoal}
            onSelectDate={setSelectedDate}
          />

          <form className="max-w-xl" onSubmit={(event) => void onSaveWeight(event)}>
            <Input
              label={t('calories.weightToday')}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={weightInput}
              onChange={(event) => setWeightInput(event.target.value)}
              placeholder="84.1"
              hint={t('calories.weightDecimalHint')}
              action={
                <Button type="submit" isLoading={setWeight.isPending} className="w-full sm:!w-44">
                  {t('calories.saveWeight')}
                </Button>
              }
            />
          </form>
        </section>

        <ErrorMessage message={formError ?? undefined} />
      </section>

      <CalorieHelperDialog
        open={helperOpen}
        settings={settings}
        currentWeightKg={dayWeight}
        applying={updateSettings.isPending}
        onClose={() => setHelperOpen(false)}
        onApply={(calories, targetWeightKg) => void onApplyHelper(calories, targetWeightKg)}
      />
    </div>
  );
}
