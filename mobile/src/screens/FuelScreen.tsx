import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { WaterGlasses } from '../components/WaterGlasses';
import {
  useCreateMeal,
  useDeleteMeal,
  useNutritionPeriod,
  useSetWater,
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

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
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
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const periodQuery = useNutritionPeriod(year, month);
  const updateSettings = useUpdateNutritionSettings();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();
  const setWater = useSetWater();

  useEffect(() => {
    if (!periodQuery.data) return;
    setCalorieGoalInput(String(periodQuery.data.settings.calorieGoal));
    setWaterGoalInput(String(periodQuery.data.settings.waterGoal));
  }, [periodQuery.data]);

  useEffect(() => {
    setEditingId(null);
    setTitle('');
    setKcal('');
    setFormError(null);
  }, [selectedDate]);

  const settings = periodQuery.data?.settings;
  const meals = periodQuery.data?.meals ?? [];
  const water = periodQuery.data?.water ?? [];
  const dayMeals = meals.filter((meal) => meal.date === selectedDate);
  const eaten = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const glasses = water.find((row) => row.date === selectedDate)?.glasses ?? 0;
  const calorieGoal = settings?.calorieGoal ?? 2000;
  const waterGoal = settings?.waterGoal ?? 8;
  const overeating = eaten > calorieGoal;
  const remaining = calorieGoal - eaten;
  const caloriePercent = clampPercent((eaten / Math.max(calorieGoal, 1)) * 100);
  const waterPercent = clampPercent((glasses / Math.max(waterGoal, 1)) * 100);

  const calendarDays: CalendarDaySummary[] = useMemo(() => {
    const fromApi = periodQuery.data?.days;
    if (fromApi?.length) {
      return fromApi.map((day) => ({
        date: day.date,
        total: day.mealCount,
        overdue: day.overeating ? 1 : 0,
        pending: 0,
        completed: !day.overeating && day.mealCount > 0 ? day.mealCount : 0,
        skipped: 0,
      }));
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
    } catch {
      setFormError(t('auth.errors.generic'));
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
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const resetMealForm = () => {
    setEditingId(null);
    setTitle('');
    setKcal('');
    setFormError(null);
  };

  const onStartEditMeal = (meal: Meal) => {
    setEditingId(meal.id);
    setTitle(meal.title);
    setKcal(String(meal.calories));
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
    try {
      if (editingId) {
        await updateMeal.mutateAsync({
          id: editingId,
          payload: { title: title.trim(), calories: Math.round(calories) },
        });
      } else {
        await createMeal.mutateAsync({
          title: title.trim(),
          calories: Math.round(calories),
          date: selectedDate,
        });
      }
      resetMealForm();
    } catch {
      setFormError(t('auth.errors.generic'));
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
            .catch(() => setFormError(t('auth.errors.generic')))
            .finally(() => setBusyId(null));
        },
      },
    ]);
  };

  const onWaterChange = async (next: number) => {
    setFormError(null);
    try {
      await setWater.mutateAsync({ date: selectedDate, glasses: next });
    } catch {
      setFormError(t('auth.errors.generic'));
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
                  <Text style={[styles.mealTitle, { color: colors.ink }]} numberOfLines={1}>
                    {meal.title}
                  </Text>
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
              <View style={[styles.barFill, styles.barWater, { width: `${waterPercent}%` }]} />
            </View>

            <WaterGlasses
              glasses={glasses}
              goal={waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => void onWaterChange(next)}
            />
          </View>

          {formError ? <Text style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressValue: { fontSize: 13, fontWeight: '700' },
  barTrack: { borderRadius: 999, height: 8, overflow: 'hidden' },
  barFill: { borderRadius: 999, height: '100%' },
  barWater: { backgroundColor: '#38bdf8' },
  mealRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
});
