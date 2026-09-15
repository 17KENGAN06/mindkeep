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
  useUpdateNutritionSettings,
} from '../features/nutrition/useNutrition';
import type { AppLanguage } from '../i18n';
import { colors } from '../theme';
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

  const periodQuery = useNutritionPeriod(year, month);
  const updateSettings = useUpdateNutritionSettings();
  const createMeal = useCreateMeal();
  const deleteMeal = useDeleteMeal();
  const setWater = useSetWater();

  useEffect(() => {
    if (!periodQuery.data) return;
    setCalorieGoalInput(String(periodQuery.data.settings.calorieGoal));
    setWaterGoalInput(String(periodQuery.data.settings.waterGoal));
  }, [periodQuery.data]);

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

  const onAddMeal = async () => {
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
      await createMeal.mutateAsync({
        title: title.trim(),
        calories: Math.round(calories),
        date: selectedDate,
      });
      setTitle('');
      setKcal('');
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
          <Text style={styles.title}>{t('fuel.title')}</Text>
          <Text style={styles.subtitle}>{t('fuel.subtitle')}</Text>

          {periodQuery.isError ? <Text style={styles.error}>{t('auth.errors.generic')}</Text> : null}

          <MonthGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            days={calendarDays}
            onMonthChange={onMonthChange}
            onSelectDate={setSelectedDate}
          />

          <View style={styles.dayHead}>
            <Text style={styles.dayTitle}>{t('fuel.dayTitle', { date: formatDate(selectedDate, language) })}</Text>
            {overeating ? <Badge tone="danger" label={t('fuel.overeating')} /> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('fuel.caloriesTitle')}</Text>
            <Text style={styles.label}>{t('fuel.calorieGoal')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={styles.input}
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
              <Text style={styles.muted}>{t('fuel.progress')}</Text>
              <Text style={[styles.progressValue, overeating && styles.overText]}>
                {eaten} / {calorieGoal} {t('fuel.kcal')}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  overeating ? styles.barOver : styles.barOk,
                  { width: `${caloriePercent}%` },
                ]}
              />
            </View>

            <Text style={styles.sectionTitle}>{t('fuel.addMeal')}</Text>
            <Text style={styles.label}>{t('fuel.mealTitle')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('fuel.mealPlaceholder')}
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>{t('fuel.mealCalories')}</Text>
            <TextInput keyboardType="number-pad" style={styles.input} value={kcal} onChangeText={setKcal} />
            <AppButton
              label={t('fuel.saveMeal')}
              loading={createMeal.isPending}
              onPress={() => void onAddMeal()}
            />

            {dayMeals.length === 0 ? (
              <Text style={styles.empty}>{t('fuel.emptyMeals')}</Text>
            ) : (
              dayMeals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <Text style={styles.mealTitle} numberOfLines={1}>
                    {meal.title}
                  </Text>
                  <Text style={styles.muted}>
                    {meal.calories} {t('fuel.kcal')}
                  </Text>
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('fuel.waterTitle')}</Text>
            <Text style={styles.muted}>{t('fuel.waterHint')}</Text>
            <Text style={styles.label}>{t('fuel.waterGoal')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={styles.input}
              value={waterGoalInput}
              onChangeText={setWaterGoalInput}
            />
            <AppButton
              label={t('common.save')}
              loading={updateSettings.isPending}
              onPress={() => void onSaveWaterGoal()}
            />

            <View style={styles.progressRow}>
              <Text style={styles.muted}>{t('fuel.waterProgress')}</Text>
              <Text style={styles.progressValue}>
                {glasses} / {waterGoal} {t('fuel.glasses')}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barWater, { width: `${waterPercent}%` }]} />
            </View>

            <WaterGlasses
              glasses={glasses}
              goal={waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => void onWaterChange(next)}
            />
          </View>

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg, flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14 },
  dayHead: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayTitle: { color: colors.ink, flex: 1, fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: 8 },
  error: { color: colors.danger, fontSize: 14 },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  overText: { color: colors.danger },
  barTrack: { backgroundColor: colors.line, borderRadius: 999, height: 8, overflow: 'hidden' },
  barFill: { borderRadius: 999, height: '100%' },
  barOk: { backgroundColor: colors.brand },
  barOver: { backgroundColor: colors.danger },
  barWater: { backgroundColor: '#38bdf8' },
  mealRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  mealTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '600' },
});
