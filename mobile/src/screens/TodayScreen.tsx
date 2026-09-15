import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { WaterGlasses } from '../components/WaterGlasses';
import { useAuth } from '../features/auth/useAuth';
import { useNutritionPeriod, useSetWater } from '../features/nutrition/useNutrition';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useOverdueReminders, useTodayReminders } from '../features/reminders/useReminders';
import { useTodayTasks, useToggleTask } from '../features/tasks/useDailyTasks';
import type { AppTabParamList } from '../navigation/types';
import { colors } from '../theme';
import { todayDateKey } from '../utils/date';

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

export function TodayScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const today = todayDateKey();
  const [year, month] = useMemo(() => {
    const [yearPart, monthPart] = today.split('-');
    return [Number(yearPart), Number(monthPart)] as const;
  }, [today]);

  const tasksQuery = useTodayTasks(today);
  const nutritionQuery = useNutritionPeriod(year, month);
  const todayReminders = useTodayReminders();
  const overdueReminders = useOverdueReminders();
  const unreadQuery = useUnreadNotificationsCount();
  const toggleTask = useToggleTask(today);
  const setWater = useSetWater(year, month);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const tasks = tasksQuery.data?.tasks ?? [];
  const meals = (nutritionQuery.data?.meals ?? []).filter((meal) => meal.date === today);
  const calorieGoal = nutritionQuery.data?.settings.calorieGoal ?? 2000;
  const waterGoal = nutritionQuery.data?.settings.waterGoal ?? 8;
  const glasses = nutritionQuery.data?.water.find((row) => row.date === today)?.glasses ?? 0;
  const eaten = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const overeating = eaten > calorieGoal;
  const reviewToday = todayReminders.data?.length ?? 0;
  const reviewOverdue = overdueReminders.data?.length ?? 0;
  const reviewTotal = reviewToday + reviewOverdue;
  const unread = unreadQuery.data ?? 0;

  const loading =
    tasksQuery.isLoading ||
    nutritionQuery.isLoading ||
    todayReminders.isLoading ||
    overdueReminders.isLoading;
  const refreshing =
    tasksQuery.isRefetching ||
    nutritionQuery.isRefetching ||
    todayReminders.isRefetching ||
    overdueReminders.isRefetching;
  const error =
    actionError ||
    tasksQuery.isError ||
    nutritionQuery.isError ||
    todayReminders.isError ||
    overdueReminders.isError;

  const onRefresh = () => {
    setActionError(false);
    void tasksQuery.refetch();
    void nutritionQuery.refetch();
    void todayReminders.refetch();
    void overdueReminders.refetch();
    void unreadQuery.refetch();
  };

  const onToggle = async (id: string, completed: boolean) => {
    setBusyTaskId(id);
    setActionError(false);
    try {
      await toggleTask.mutateAsync({ id, completed: !completed });
    } catch {
      setActionError(true);
    } finally {
      setBusyTaskId(null);
    }
  };

  if (loading && !tasksQuery.data && !nutritionQuery.data) {
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !loading}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
      >
        <Text style={styles.hello}>{t('today.hello', { name: user?.name ?? '' })}</Text>
        {error ? <Text style={styles.error}>{t('today.error')}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('today.tasks')}</Text>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>{t('today.noTasks')}</Text>
          ) : (
            tasks.map((task) => (
              <Pressable
                key={task.id}
                disabled={busyTaskId === task.id}
                onPress={() => void onToggle(task.id, task.completed)}
                style={[styles.taskRow, task.completed && styles.taskDone]}
              >
                <View style={[styles.check, task.completed && styles.checkOn]}>
                  {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]} numberOfLines={2}>
                  {task.title}
                </Text>
                <Text style={styles.minutes}>
                  {task.minutes} {t('today.min')}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable onPress={() => navigation.navigate('Review', { screen: 'ReviewInbox' })} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{t('today.reviews')}</Text>
            <Text style={styles.link}>{t('today.openReview')}</Text>
          </View>
          {reviewTotal === 0 ? (
            <Text style={styles.empty}>{t('today.noReviews')}</Text>
          ) : (
            <Text style={styles.reviewCount}>
              {t('today.reviewsDue', { today: reviewToday, overdue: reviewOverdue })}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
          style={styles.card}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{t('notifications.title')}</Text>
            <Text style={styles.link}>{t('notifications.open')}</Text>
          </View>
          <Text style={styles.reviewCount}>{t('notifications.unreadCount', { count: unread })}</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{t('today.calories')}</Text>
            {overeating ? <Text style={styles.over}>{t('today.overeating')}</Text> : null}
          </View>
          {meals.length === 0 ? <Text style={styles.empty}>{t('today.noMeals')}</Text> : null}
          <Text style={[styles.progressLabel, overeating && styles.over]}>
            {eaten} / {calorieGoal} {t('today.kcal')}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                overeating ? styles.barOver : styles.barOk,
                { width: `${clampPercent((eaten / Math.max(calorieGoal, 1)) * 100)}%` },
              ]}
            />
          </View>
          {meals.slice(0, 4).map((meal) => (
            <View key={meal.id} style={styles.mealRow}>
              <Text style={styles.mealTitle} numberOfLines={1}>
                {meal.title}
              </Text>
              <Text style={styles.minutes}>
                {meal.calories} {t('today.kcal')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('today.water')}</Text>
          <Text style={styles.progressLabel}>
            {glasses} / {waterGoal}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barOk,
                { width: `${clampPercent((glasses / Math.max(waterGoal, 1)) * 100)}%` },
              ]}
            />
          </View>
          <View style={styles.waterWrap}>
            <WaterGlasses
              glasses={glasses}
              goal={waterGoal}
              disabled={setWater.isPending}
              onChange={(next) => {
                setActionError(false);
                void setWater.mutateAsync({ date: today, glasses: next }).catch(() => {
                  setActionError(true);
                });
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  hello: { color: colors.ink, fontSize: 28, fontWeight: '700', marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  link: { color: colors.brand, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: 8 },
  taskRow: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    padding: 10,
  },
  taskDone: { borderColor: 'rgba(142, 239, 180, 0.35)' },
  check: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  checkOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: '#07110d', fontWeight: '800' },
  taskTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '600' },
  taskTitleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  minutes: { color: colors.muted, fontSize: 13 },
  reviewCount: { color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: 4 },
  over: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  progressLabel: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  barTrack: { backgroundColor: colors.line, borderRadius: 999, height: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barOk: { backgroundColor: colors.brand },
  barOver: { backgroundColor: colors.danger },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  mealTitle: { color: colors.ink, flex: 1, fontSize: 14 },
  waterWrap: { marginTop: 14 },
});
