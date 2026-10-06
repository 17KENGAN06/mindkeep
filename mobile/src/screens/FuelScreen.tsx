import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MonthGrid } from '../components/MonthGrid';
import { AppButton, Badge } from '../components/ui';
import { mapAuthError } from '../features/auth/mapAuthError';
import { WaterGlasses } from '../components/WaterGlasses';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { CalorieHelperModal } from '../features/nutrition/CalorieHelperModal';
import {
  useCreateMeal,
  useDeleteMeal,
  useNutritionPeriod,
  useSetWater,
  useSetWeight,
  useUpdateMeal,
  useUpdateNutritionSettings,
} from '../features/nutrition/useNutrition';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { CalendarDaySummary } from '../types/calendar';
import type { Meal } from '../types/nutrition';
import { formatDate, todayDateKey } from '../utils/date';

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split('-').map(Number);
  return y === year && m === month;
}

function formatKg(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function parseKg(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 20 || parsed > 400) return null;
  return Math.round(parsed * 10) / 10;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

type MacroDraft = { protein: string; fat: string; carbs: string };

const emptyMacroDraft: MacroDraft = { protein: '', fat: '', carbs: '' };

function macroDraftFrom(meal: Meal): MacroDraft {
  return {
    protein: meal.protein == null ? '' : String(meal.protein),
    fat: meal.fat == null ? '' : String(meal.fat),
    carbs: meal.carbs == null ? '' : String(meal.carbs),
  };
}

function parseGrams(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2000) return 'invalid';
  return Math.round(parsed * 10) / 10;
}

/** Returns null when any field holds something that is not a sane gram amount. */
function parseMacroDraft(draft: MacroDraft) {
  const protein = parseGrams(draft.protein);
  const fat = parseGrams(draft.fat);
  const carbs = parseGrams(draft.carbs);
  if (protein === 'invalid' || fat === 'invalid' || carbs === 'invalid') return null;
  return { protein, fat, carbs };
}

function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function FuelScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const today = todayDateKey();
  const initial = new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [calorieGoalInput, setCalorieGoalInput] = useState('');
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [weightGoalInput, setWeightGoalInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [helperOpen, setHelperOpen] = useState(false);
  const [macroDraft, setMacroDraft] = useState<MacroDraft>(emptyMacroDraft);

  const periodQuery = useNutritionPeriod(year, month);
  const updateSettings = useUpdateNutritionSettings();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();
  const setWater = useSetWater();
  const setWeight = useSetWeight();

  useEffect(() => {
    if (!periodQuery.data) return;
    setCalorieGoalInput(String(periodQuery.data.settings.calorieGoal));
    setWaterGoalInput(String(periodQuery.data.settings.waterGoal));
    setWeightGoalInput(
      periodQuery.data.settings.weightGoal == null
        ? ''
        : formatKg(periodQuery.data.settings.weightGoal),
    );
  }, [periodQuery.data]);

  useEffect(() => {
    const logged = periodQuery.data?.weight?.find((row) => row.date === selectedDate)?.kg;
    setWeightInput(logged == null ? '' : formatKg(logged));
  }, [periodQuery.data, selectedDate]);

  useEffect(() => {
    setEditingId(null);
    setTitle('');
    setKcal('');
    setMacroDraft(emptyMacroDraft);
    setFormError(null);
  }, [selectedDate]);

  const settings = periodQuery.data?.settings;
  const meals = periodQuery.data?.meals ?? [];
  const water = periodQuery.data?.water ?? [];
  const weight = periodQuery.data?.weight ?? [];
  const weightAvg = periodQuery.data?.weightAvg ?? null;
  const dayMeals = meals.filter((meal) => meal.date === selectedDate);
  const eaten = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const glasses = water.find((row) => row.date === selectedDate)?.glasses ?? 0;
  const dayWeight = weight.find((row) => row.date === selectedDate)?.kg ?? null;
  const weightGoal = settings?.weightGoal ?? null;
  const calorieGoal = settings?.calorieGoal ?? 2000;
  const waterGoal = settings?.waterGoal ?? 8;
  const macrosEnabled = settings?.macrosEnabled ?? false;
  const dayMacros = dayMeals.reduce(
    (totals, meal) => ({
      protein: totals.protein + (meal.protein ?? 0),
      fat: totals.fat + (meal.fat ?? 0),
      carbs: totals.carbs + (meal.carbs ?? 0),
    }),
    { protein: 0, fat: 0, carbs: 0 },
  );
  const overeating = eaten > calorieGoal;
  const remaining = calorieGoal - eaten;
  const caloriePercent = clampPercent((eaten / Math.max(calorieGoal, 1)) * 100);
  const waterPercent = clampPercent((glasses / Math.max(waterGoal, 1)) * 100);

  const calendarDays: CalendarDaySummary[] = useMemo(() => {
    const fromApi = periodQuery.data?.days;
    if (fromApi?.length) {
      return fromApi.map((day) => {
        const marked = day.mealCount > 0 || day.weightKg != null;
        return {
          date: day.date,
          total: day.mealCount > 0 ? day.mealCount : marked ? 1 : 0,
          overdue: day.overeating ? 1 : 0,
          pending: 0,
          completed: !day.overeating && marked ? Math.max(day.mealCount, 1) : 0,
          skipped: 0,
        };
      });
    }

    const mealsByDate = new Map<string, { count: number; calories: number }>();
    for (const meal of meals) {
      const bucket = mealsByDate.get(meal.date) ?? { count: 0, calories: 0 };
      bucket.count += 1;
      bucket.calories += meal.calories;
      mealsByDate.set(meal.date, bucket);
    }

    return [...mealsByDate.entries()].map(([date, bucket]) => ({
      date,
      total: bucket.count,
      overdue: bucket.calories > calorieGoal ? 1 : 0,
      pending: 0,
      completed: bucket.calories <= calorieGoal ? bucket.count : 0,
      skipped: 0,
    }));
  }, [calorieGoal, meals, periodQuery.data?.days]);

  const onMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
    if (dateInMonth(today, nextYear, nextMonth)) {
      setSelectedDate(today);
      return;
    }
    if (!dateInMonth(selectedDate, nextYear, nextMonth)) {
      setSelectedDate(firstOfMonth(nextYear, nextMonth));
    }
  };

  const onSaveCalorieGoal = async () => {
    setFormError(null);
    const next = Number(calorieGoalInput);
    if (!Number.isFinite(next) || next < 500) {
      setFormError(t('fuel.errors.calorieGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ calorieGoal: Math.round(next) });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onSaveWaterGoal = async () => {
    setFormError(null);
    const next = Number(waterGoalInput);
    if (!Number.isFinite(next) || next < 1) {
      setFormError(t('fuel.errors.waterGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ waterGoal: Math.round(next) });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const resetMealForm = () => {
    setEditingId(null);
    setTitle('');
    setKcal('');
    setMacroDraft(emptyMacroDraft);
    setFormError(null);
  };

  const onStartEditMeal = (meal: Meal) => {
    setEditingId(meal.id);
    setTitle(meal.title);
    setKcal(String(meal.calories));
    setMacroDraft(macroDraftFrom(meal));
    setFormError(null);
  };

  const onSaveMeal = async () => {
    setFormError(null);
    const calories = Number(kcal);
    if (!title.trim()) {
      setFormError(t('fuel.errors.title'));
      return;
    }
    if (!Number.isFinite(calories) || calories < 1) {
      setFormError(t('fuel.errors.calories'));
      return;
    }
    const macros = macrosEnabled
      ? parseMacroDraft(macroDraft)
      : { protein: null, fat: null, carbs: null };
    if (!macros) {
      setFormError(t('fuel.macros.invalid'));
      return;
    }
    try {
      if (editingId) {
        await updateMeal.mutateAsync({
          id: editingId,
          payload: {
            title: title.trim(),
            calories: Math.round(calories),
            ...(macrosEnabled ? macros : {}),
          },
        });
      } else {
        await createMeal.mutateAsync({
          title: title.trim(),
          calories: Math.round(calories),
          date: selectedDate,
          ...(macros.protein == null ? {} : { protein: macros.protein }),
          ...(macros.fat == null ? {} : { fat: macros.fat }),
          ...(macros.carbs == null ? {} : { carbs: macros.carbs }),
        });
      }
      resetMealForm();
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onToggleMacros = async () => {
    setFormError(null);
    try {
      await updateSettings.mutateAsync({ macrosEnabled: !macrosEnabled });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onApplyHelper = async (calories: number, targetWeightKg: number) => {
    setFormError(null);
    try {
      await updateSettings.mutateAsync({ calorieGoal: calories, weightGoal: targetWeightKg });
      setCalorieGoalInput(String(calories));
      setWeightGoalInput(formatKg(targetWeightKg));
      setHelperOpen(false);
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onDeleteMeal = (meal: Meal) => {
    Alert.alert(t('fuel.deleteTitle'), t('fuel.deleteDescription', { title: meal.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setBusyId(meal.id);
          setFormError(null);
          void deleteMeal
            .mutateAsync(meal.id)
            .then(() => {
              if (editingId === meal.id) resetMealForm();
            })
            .catch((caught) => setFormError(mapAuthError(caught, t)))
            .finally(() => setBusyId(null));
        },
      },
    ]);
  };

  const onSaveWeightGoal = async () => {
    setFormError(null);
    const next = parseKg(weightGoalInput);
    if (next == null) {
      setFormError(t('fuel.errors.weightGoal'));
      return;
    }
    try {
      await updateSettings.mutateAsync({ weightGoal: next });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onSaveWeight = async () => {
    setFormError(null);
    const kg = parseKg(weightInput);
    if (kg == null) {
      setFormError(t('fuel.errors.weight'));
      return;
    }
    try {
      await setWeight.mutateAsync({ date: selectedDate, kg });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onWaterChange = async (next: number) => {
    setFormError(null);
    try {
      await setWater.mutateAsync({ date: selectedDate, glasses: next });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  if (periodQuery.isLoading && !periodQuery.data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={periodQuery.isRefetching && !periodQuery.isLoading}
              onRefresh={() => void periodQuery.refetch()}
              tintColor={colors.brand}
            />
          }
        >
          <Text style={[styles.title, { color: colors.ink }]}>{t('fuel.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{t('fuel.subtitle')}</Text>

          {periodQuery.isError ? (
            <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
          ) : null}

          <MonthGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            days={calendarDays}
            onMonthChange={onMonthChange}
            onSelectDate={setSelectedDate}
          />

          <View style={styles.dayHead}>
            <Text style={[styles.dayTitle, { color: colors.ink }]}>
              {t('fuel.dayTitle', { date: formatDate(selectedDate, language) })}
            </Text>
            {overeating ? <Badge tone="danger" label={t('fuel.overeating')} /> : null}
          </View>

          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('fuel.caloriesTitle')}</Text>
            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.calorieGoal')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={calorieGoalInput}
              onChangeText={setCalorieGoalInput}
            />
            <AppButton
              label={t('common.save')}
              loading={updateSettings.isPending}
              onPress={() => void onSaveCalorieGoal()}
            />
            <AppButton
              variant="secondary"
              label={t('fuel.helper.open')}
              onPress={() => setHelperOpen(true)}
            />
            <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.helper.openHint')}</Text>

            <View style={styles.stats}>
              <Stat label={t('fuel.statEaten')} value={`${eaten} ${t('fuel.kcal')}`} />
              <Stat label={t('fuel.statGoal')} value={`${calorieGoal} ${t('fuel.kcal')}`} />
              <Stat
                label={overeating ? t('fuel.statOver') : t('fuel.statLeft')}
                value={`${Math.abs(remaining)} ${t('fuel.kcal')}`}
              />
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.progress')}</Text>
              <Text
                style={[
                  styles.progressValue,
                  { color: colors.ink },
                  overeating && { color: colors.danger },
                ]}
              >
                {eaten} / {calorieGoal} {t('fuel.kcal')}
              </Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
              <View
                style={[
                  styles.barFill,
                  { backgroundColor: overeating ? colors.danger : colors.brand, width: `${caloriePercent}%` },
                ]}
              />
            </View>

            <View style={styles.macroHead}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('fuel.macros.title')}</Text>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: macrosEnabled }}
                disabled={updateSettings.isPending}
                onPress={() => void onToggleMacros()}
                style={[
                  styles.macroSwitch,
                  { borderColor: macrosEnabled ? colors.brand : colors.line },
                  macrosEnabled && { backgroundColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    styles.macroSwitchText,
                    { color: macrosEnabled ? colors.onBrand : colors.muted },
                  ]}
                >
                  {macrosEnabled ? t('fuel.macros.on') : t('fuel.macros.off')}
                </Text>
              </Pressable>
            </View>
            {macrosEnabled ? (
              <View style={styles.stats}>
                <Stat
                  label={t('fuel.macros.protein')}
                  value={`${formatGrams(dayMacros.protein)} ${t('fuel.macros.grams')}`}
                />
                <Stat
                  label={t('fuel.macros.fat')}
                  value={`${formatGrams(dayMacros.fat)} ${t('fuel.macros.grams')}`}
                />
                <Stat
                  label={t('fuel.macros.carbs')}
                  value={`${formatGrams(dayMacros.carbs)} ${t('fuel.macros.grams')}`}
                />
              </View>
            ) : (
              <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.macros.offHint')}</Text>
            )}

            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              {editingId ? t('fuel.editMeal') : t('fuel.addMeal')}
            </Text>
            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.mealTitle')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={t('fuel.mealPlaceholder')}
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.mealCalories')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={kcal}
              onChangeText={setKcal}
            />
            {macrosEnabled
              ? (
                  [
                    { key: 'protein' as const, label: t('fuel.macros.protein') },
                    { key: 'fat' as const, label: t('fuel.macros.fat') },
                    { key: 'carbs' as const, label: t('fuel.macros.carbs') },
                  ] as const
                ).map((macro) => (
                  <View key={macro.key}>
                    <Text style={[styles.label, { color: colors.muted }]}>{macro.label}</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      style={[
                        styles.input,
                        { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
                      ]}
                      value={macroDraft[macro.key]}
                      onChangeText={(next) =>
                        setMacroDraft((current) => ({ ...current, [macro.key]: next }))
                      }
                      placeholder={t('fuel.macros.gramsShort')}
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                ))
              : null}
            <AppButton
              label={editingId ? t('common.save') : t('fuel.saveMeal')}
              loading={createMeal.isPending || updateMeal.isPending}
              onPress={() => void onSaveMeal()}
            />
            {editingId ? (
              <AppButton variant="ghost" label={t('common.cancel')} onPress={resetMealForm} />
            ) : null}

            {dayMeals.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>{t('fuel.emptyMeals')}</Text>
            ) : (
              dayMeals.map((meal) => (
                <View
                  key={meal.id}
                  style={[
                    styles.mealRow,
                    editingId === meal.id && { borderColor: colors.brand, borderRadius: 12, borderWidth: 1, padding: 6 },
                  ]}
                >
                  <View style={styles.mealCopy}>
                    <Text style={[styles.mealTitle, { color: colors.ink }]} numberOfLines={1}>
                      {meal.title}
                    </Text>
                    {macrosEnabled &&
                    (meal.protein != null || meal.fat != null || meal.carbs != null) ? (
                      <Text style={[styles.mealMacros, { color: colors.muted }]}>
                        {[
                          meal.protein == null
                            ? null
                            : `${t('fuel.macros.proteinShort')} ${formatGrams(meal.protein)}`,
                          meal.fat == null
                            ? null
                            : `${t('fuel.macros.fatShort')} ${formatGrams(meal.fat)}`,
                          meal.carbs == null
                            ? null
                            : `${t('fuel.macros.carbsShort')} ${formatGrams(meal.carbs)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}{' '}
                        {t('fuel.macros.grams')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.muted, { color: colors.muted }]}>
                    {meal.calories} {t('fuel.kcal')}
                  </Text>
                  <AppButton
                    variant="ghost"
                    label={t('common.edit')}
                    disabled={busyId === meal.id}
                    onPress={() => onStartEditMeal(meal)}
                  />
                  <AppButton
                    variant="ghost"
                    label={t('common.delete')}
                    disabled={busyId === meal.id || deleteMeal.isPending}
                    onPress={() => onDeleteMeal(meal)}
                  />
                </View>
              ))
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('fuel.waterTitle')}</Text>
            <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.waterHint')}</Text>
            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.waterGoal')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={waterGoalInput}
              onChangeText={setWaterGoalInput}
            />
            <AppButton
              label={t('common.save')}
              loading={updateSettings.isPending}
              onPress={() => void onSaveWaterGoal()}
            />

            <View style={styles.progressRow}>
              <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.waterProgress')}</Text>
              <Text style={[styles.progressValue, { color: colors.ink }]}>
                {glasses} / {waterGoal} {t('fuel.glasses')}
              </Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
              <View style={[styles.barFill, { backgroundColor: colors.brand, width: `${waterPercent}%` }]} />
            </View>

            <WaterGlasses
              glasses={glasses}
              goal={waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => void onWaterChange(next)}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('fuel.weightTitle')}</Text>
            <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.weightGuide')}</Text>
            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.weightGoal')}</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={weightGoalInput}
              onChangeText={setWeightGoalInput}
            />
            <AppButton
              label={t('common.save')}
              loading={updateSettings.isPending}
              onPress={() => void onSaveWeightGoal()}
            />

            <View style={styles.stats}>
              <Stat
                label={t('fuel.weightToday')}
                value={dayWeight == null ? '—' : `${formatKg(dayWeight)} ${t('fuel.kg')}`}
              />
              <Stat
                label={t('fuel.statAvg')}
                value={weightAvg == null ? '—' : `${formatKg(weightAvg)} ${t('fuel.kg')}`}
              />
              <Stat
                label={t('fuel.statTarget')}
                value={weightGoal == null ? '—' : `${formatKg(weightGoal)} ${t('fuel.kg')}`}
              />
              <Stat
                label={
                  dayWeight == null || weightGoal == null
                    ? t('fuel.statLeft')
                    : Math.abs(dayWeight - weightGoal) < 0.05
                      ? t('fuel.statOnTarget')
                      : dayWeight > weightGoal
                        ? t('fuel.statToLose')
                        : t('fuel.statToGain')
                }
                value={
                  dayWeight == null || weightGoal == null
                    ? '—'
                    : `${formatKg(Math.abs(dayWeight - weightGoal))} ${t('fuel.kg')}`
                }
              />
            </View>

            <WeightTrendChart
              points={periodQuery.data?.weightTrend ?? weight}
              selectedDate={selectedDate}
              year={year}
              month={month}
              goalKg={weightGoal}
              onSelectDate={setSelectedDate}
            />

            <Text style={[styles.label, { color: colors.muted }]}>{t('fuel.weightToday')}</Text>
            <Text style={[styles.muted, { color: colors.muted }]}>{t('fuel.weightDecimalHint')}</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="84.1"
              placeholderTextColor={colors.muted}
            />
            <AppButton
              label={t('fuel.saveWeight')}
              loading={setWeight.isPending}
              onPress={() => void onSaveWeight()}
            />
          </View>

          {formError ? <Text style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <CalorieHelperModal
        visible={helperOpen}
        settings={settings}
        currentWeightKg={dayWeight}
        applying={updateSettings.isPending}
        onClose={() => setHelperOpen(false)}
        onApply={(calories, targetWeightKg) => void onApplyHelper(calories, targetWeightKg)}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  dayHead: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600' },
  muted: { fontSize: 13 },
  empty: { fontSize: 14, paddingVertical: 8 },
  error: { fontSize: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    padding: 10,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressValue: { fontSize: 13, fontWeight: '700' },
  barTrack: { borderRadius: 999, height: 8, overflow: 'hidden' },
  barFill: { borderRadius: 999, height: '100%' },
  mealRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealCopy: { flex: 1, gap: 2, minWidth: 120 },
  mealTitle: { fontSize: 15, fontWeight: '600' },
  mealMacros: { fontSize: 12 },
  macroHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  macroSwitch: {
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
  },
  macroSwitchText: { fontSize: 12, fontWeight: '700' },
});
