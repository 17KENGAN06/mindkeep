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
import { AppIcon } from '../components/AppIcon';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../features/auth/useAuth';
import { currentPeriodDefaults, formatMoney } from '../features/finance/financeUtils';
import { useFinanceSummary } from '../features/finance/useFinance';
import { useNutritionPeriod, useSetWater } from '../features/nutrition/useNutrition';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications';
import { useActivityStatistics, useDashboardStatistics } from '../features/statistics/useStatistics';
import { useTasksPeriod, useTodayTasks, useToggleTask } from '../features/tasks/useDailyTasks';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { AppTabParamList } from '../navigation/types';
import { lastNDateKeys, todayDateKey } from '../utils/date';

type WeekTab = 'tasks' | 'reviews' | 'expenses';

const CATEGORY_COLORS = ['#8eefb4', '#5b8def', '#a78bfa', '#f59e0b', '#94a3b8', '#f472b6'];

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

function ProgressCard({
  title,
  valueText,
  percent,
  onPress,
}: {
  title: string;
  valueText: string;
  percent: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const safe = clampPercent(percent);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.progressCard, { backgroundColor: colors.panel, borderColor: colors.line }]}
    >
      <Text style={[styles.progressTitle, { color: colors.muted }]}>{title}</Text>
      <Text style={[styles.progressValue, { color: colors.ink }]}>{valueText}</Text>
      <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
        <View style={[styles.barFill, { backgroundColor: colors.brand, width: `${safe}%` }]} />
      </View>
      <Text style={[styles.progressPct, { color: colors.brand }]}>{safe}%</Text>
    </Pressable>
  );
}

export function TodayScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const today = todayDateKey();
  const period = currentPeriodDefaults();
  const [weekTab, setWeekTab] = useState<WeekTab>('tasks');
  const weekDays = useMemo(() => lastNDateKeys(7), []);

  const tasksQuery = useTodayTasks(today);
  const monthTasksQuery = useTasksPeriod(period.year, period.month);
  const prevMonth = period.month === 1 ? 12 : period.month - 1;
  const prevYear = period.month === 1 ? period.year - 1 : period.year;
  const prevTasksQuery = useTasksPeriod(prevYear, prevMonth);
  const nutritionQuery = useNutritionPeriod(period.year, period.month);
  const financeQuery = useFinanceSummary(period);
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const unreadQuery = useUnreadNotificationsCount();
  const toggleTask = useToggleTask(today);
  const setWater = useSetWater(period.year, period.month);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const tasks = tasksQuery.data?.tasks ?? [];
  const meals = (nutritionQuery.data?.meals ?? []).filter((meal) => meal.date === today);
  const calorieGoal = nutritionQuery.data?.settings.calorieGoal ?? 2000;
  const waterGoal = nutritionQuery.data?.settings.waterGoal ?? 8;
  const glasses = nutritionQuery.data?.water.find((row) => row.date === today)?.glasses ?? 0;
  const eaten = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const overeating = eaten > calorieGoal;
  const stats = dashboardQuery.data?.stats;
  const reviewToday = stats?.todayReminders ?? 0;
  const reviewOverdue = stats?.overdueReminders ?? 0;
  const reviewTotal = reviewToday + reviewOverdue;
  const completedReviews = stats?.completedReviews ?? 0;
  const reviewsPlanned = completedReviews + reviewTotal;
  const unread = unreadQuery.data ?? 0;
  const recentMaterials = dashboardQuery.data?.recentMaterials ?? [];

  const todayDone = tasks.filter((task) => task.completed).length;
  const todayTotal = tasks.length;
  const finance = financeQuery.data;
  const spentToday = (finance?.operations ?? [])
    .filter((op) => op.type === 'EXPENSE' && op.date.slice(0, 10) === today)
    .reduce((sum, op) => sum + op.amount, 0);
  const monthExpense = finance?.totals.expense ?? 0;
  const monthIncome = finance?.totals.income ?? 0;
  const opening = finance?.totals.openingBalance ?? 0;
  const budgetTotal = Math.max(opening + monthIncome, monthExpense, 1);
  const budgetLeft = Math.max(budgetTotal - monthExpense, 0);
  const dayOfMonth = new Date().getDate();
  const softDailyLimit = Math.max(monthExpense / Math.max(dayOfMonth, 1), spentToday, 1);
  const categorySegments = (finance?.byCategory ?? [])
    .filter((item) => item.expense > 0)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]!,
    }));
  const categoryTotal = categorySegments.reduce((sum, item) => sum + item.expense, 0);

  const weekTaskPool = [...(monthTasksQuery.data?.tasks ?? []), ...(prevTasksQuery.data?.tasks ?? [])];
  const weekSeries = weekDays.map((date) => {
    const reviewsDone = activityQuery.data?.activity.find((point) => point.date === date)?.count ?? 0;
    const expenses = (finance?.operations ?? [])
      .filter((op) => op.type === 'EXPENSE' && op.date.slice(0, 10) === date)
      .reduce((sum, op) => sum + op.amount, 0);
    const dayTasks = weekTaskPool.filter((task) => task.date === date);
    return {
      date,
      tasksDone: dayTasks.filter((task) => task.completed).length,
      tasksPlanned: dayTasks.length,
      reviewsDone,
      expenses,
    };
  });

  const chartMax = Math.max(
    1,
    ...weekSeries.map((day) => {
      if (weekTab === 'tasks') return Math.max(day.tasksPlanned, day.tasksDone);
      if (weekTab === 'reviews') return day.reviewsDone;
      return day.expenses;
    }),
  );

  const loading =
    tasksQuery.isLoading ||
    nutritionQuery.isLoading ||
    dashboardQuery.isLoading;
  const refreshing =
    tasksQuery.isRefetching ||
    nutritionQuery.isRefetching ||
    dashboardQuery.isRefetching ||
    financeQuery.isRefetching ||
    activityQuery.isRefetching;
  const error =
    actionError ||
    tasksQuery.isError ||
    nutritionQuery.isError ||
    dashboardQuery.isError;

  const onRefresh = () => {
    setActionError(false);
    void tasksQuery.refetch();
    void nutritionQuery.refetch();
    void dashboardQuery.refetch();
    void activityQuery.refetch();
    void financeQuery.refetch();
    void unreadQuery.refetch();
    void monthTasksQuery.refetch();
    void prevTasksQuery.refetch();
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
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
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
        <View style={styles.helloRow}>
          <BrandMark size={44} />
          <View style={styles.helloCopy}>
            <Text style={[styles.hello, { color: colors.ink }]}>{t('today.hello', { name: user?.name ?? '' })}</Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>{t('dashboard.tagline')}</Text>
          </View>
        </View>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{t('today.error')}</Text> : null}

        <View style={styles.grid}>
          <ProgressCard
            title={t('dashboard.cards.tasksToday')}
            valueText={t('dashboard.cards.of', { done: todayDone, total: todayTotal })}
            percent={todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0}
            onPress={() => navigation.navigate('Tasks', { screen: 'TasksHome' })}
          />
          <ProgressCard
            title={t('dashboard.cards.reviews')}
            valueText={t('dashboard.cards.ofPlanned', {
              done: completedReviews,
              total: reviewsPlanned,
            })}
            percent={reviewsPlanned > 0 ? (completedReviews / reviewsPlanned) * 100 : 0}
            onPress={() => navigation.navigate('Review', { screen: 'ReviewInbox' })}
          />
          <ProgressCard
            title={t('dashboard.cards.spentToday')}
            valueText={`${formatMoney(spentToday, language)} / ${formatMoney(softDailyLimit, language)}`}
            percent={(spentToday / softDailyLimit) * 100}
            onPress={() => navigation.navigate('More', { screen: 'Finance' })}
          />
          <ProgressCard
            title={t('dashboard.cards.budgetLeft')}
            valueText={`${formatMoney(budgetLeft, language)} / ${formatMoney(budgetTotal, language)}`}
            percent={(budgetLeft / budgetTotal) * 100}
            onPress={() => navigation.navigate('More', { screen: 'Finance' })}
          />
          <ProgressCard
            title={t('dashboard.cards.caloriesToday')}
            valueText={`${eaten} / ${calorieGoal}`}
            percent={(eaten / Math.max(calorieGoal, 1)) * 100}
            onPress={() => navigation.navigate('Fuel')}
          />
          <ProgressCard
            title={t('dashboard.cards.waterToday')}
            valueText={`${glasses} / ${waterGoal} ${t('fuel.glasses')}`}
            percent={(glasses / Math.max(waterGoal, 1)) * 100}
            onPress={() => navigation.navigate('Fuel')}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('dashboard.upcomingTasks')}</Text>
            <Pressable onPress={() => navigation.navigate('Tasks', { screen: 'TasksHome' })}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('dashboard.allTasks')}</Text>
            </Pressable>
          </View>
          {tasks.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('dashboard.modules.noTasksToday')}</Text>
          ) : (
            tasks.slice(0, 6).map((task) => (
              <Pressable
                key={task.id}
                disabled={busyTaskId === task.id}
                onPress={() => void onToggle(task.id, task.completed)}
                style={[
                  styles.taskRow,
                  { borderColor: colors.line },
                  task.completed && { borderColor: `${colors.brand}59` },
                ]}
              >
                <View
                  style={[
                    styles.check,
                    { borderColor: colors.line },
                    task.completed && { backgroundColor: colors.brand, borderColor: colors.brand },
                  ]}
                >
                  {task.completed ? <AppIcon name="checkmark" color={colors.onBrand} size={18} /> : null}
                </View>
                <Text
                  style={[
                    styles.taskTitle,
                    { color: colors.ink },
                    task.completed && { color: colors.muted, textDecorationLine: 'line-through' },
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                <Text style={[styles.minutes, { color: colors.muted }]}>
                  {task.minutes} {t('today.min')}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          onPress={() => navigation.navigate('Review', { screen: 'ReviewInbox' })}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('today.reviews')}</Text>
            <Text style={[styles.link, { color: colors.brand }]}>{t('today.openReview')}</Text>
          </View>
          {reviewTotal === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('today.noReviews')}</Text>
          ) : (
            <Text style={[styles.reviewCount, { color: colors.ink }]}>
              {t('today.reviewsDue', { today: reviewToday, overdue: reviewOverdue })}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('notifications.title')}</Text>
            <Text style={[styles.link, { color: colors.brand }]}>{t('notifications.open')}</Text>
          </View>
          <Text style={[styles.reviewCount, { color: colors.ink }]}>
            {t('notifications.unreadCount', { count: unread })}
          </Text>
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('dashboard.fuelTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('Fuel')}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('dashboard.allFuel')}</Text>
            </Pressable>
          </View>
          {overeating ? <Text style={[styles.over, { color: colors.danger }]}>{t('today.overeating')}</Text> : null}
          {meals.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('dashboard.noMealsToday')}</Text>
          ) : null}
          <Text style={[styles.progressLabel, { color: colors.muted }, overeating && { color: colors.danger }]}>
            {eaten} / {calorieGoal} {t('today.kcal')}
          </Text>
          <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
            <View
              style={[
                styles.barFill,
                { backgroundColor: overeating ? colors.danger : colors.brand },
                { width: `${clampPercent((eaten / Math.max(calorieGoal, 1)) * 100)}%` },
              ]}
            />
          </View>
          {meals.slice(0, 4).map((meal) => (
            <View key={meal.id} style={styles.mealRow}>
              <Text style={[styles.mealTitle, { color: colors.ink }]} numberOfLines={1}>
                {meal.title}
              </Text>
              <Text style={[styles.minutes, { color: colors.muted }]}>
                {meal.calories} {t('today.kcal')}
              </Text>
            </View>
          ))}
          <Text style={[styles.progressLabel, styles.waterLabel, { color: colors.muted }]}>
            {glasses} / {waterGoal} {t('fuel.glasses')}
          </Text>
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

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('dashboard.weekTitle')}</Text>
          </View>
          <View style={styles.tabs}>
            {(['tasks', 'reviews', 'expenses'] as const).map((id) => (
              <Pressable
                key={id}
                onPress={() => setWeekTab(id)}
                style={[
                  styles.tab,
                  { borderColor: colors.line },
                  weekTab === id && { backgroundColor: colors.brand, borderColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    { color: colors.muted, fontSize: 12, fontWeight: '700' },
                    weekTab === id && { color: colors.onBrand },
                  ]}
                >
                  {t(`dashboard.weekTabs.${id}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chartRow}>
            {weekSeries.map((day) => {
              const planned =
                weekTab === 'tasks' ? day.tasksPlanned : weekTab === 'reviews' ? day.reviewsDone : day.expenses;
              const done =
                weekTab === 'tasks' ? day.tasksDone : weekTab === 'reviews' ? day.reviewsDone : day.expenses;
              const plannedHeight = Math.max((planned / chartMax) * 100, planned > 0 ? 8 : 4);
              const doneHeight = Math.max((done / chartMax) * 100, done > 0 ? 8 : 0);
              return (
                <View key={day.date} style={styles.chartCol}>
                  <View style={styles.chartBars}>
                    <View
                      style={[
                        styles.chartPlanned,
                        { height: `${plannedHeight}%`, backgroundColor: `${colors.brand}47` },
                      ]}
                    />
                    <View
                      style={[
                        styles.chartDone,
                        { height: `${doneHeight}%`, backgroundColor: colors.brand },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.muted }]}>{day.date.slice(8)}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <Text style={[styles.legendItem, { color: colors.brand }]}>● {t('dashboard.legendDone')}</Text>
            <Text style={[styles.legendMuted, { color: colors.muted }]}>● {t('dashboard.legendPlanned')}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('dashboard.recentTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('Review', { screen: 'Materials' })}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('dashboard.viewAllMaterials')}</Text>
            </Pressable>
          </View>
          {recentMaterials.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('materials.emptyDescription')}</Text>
          ) : (
            recentMaterials.slice(0, 4).map((material) => (
              <Pressable
                key={material.id}
                onPress={() =>
                  navigation.navigate('Review', { screen: 'MaterialDetail', params: { id: material.id } })
                }
                style={[styles.materialRow, { borderColor: colors.line }]}
              >
                <View style={styles.materialBody}>
                  <Text style={[styles.materialTitle, { color: colors.ink }]} numberOfLines={1}>
                    {material.title}
                  </Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    {material.category?.name ?? t('materials.fields.noCategory')}
                  </Text>
                </View>
                <Text style={[styles.link, { color: colors.brand }]}>{t('today.openReview')}</Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('dashboard.financeTitle')}</Text>
            <Pressable onPress={() => navigation.navigate('More', { screen: 'Finance' })}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('dashboard.allFinance')}</Text>
            </Pressable>
          </View>
          {!finance || categoryTotal === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('dashboard.modules.noFinance')}</Text>
          ) : (
            categorySegments.map((item) => {
              const share = Math.round((item.expense / categoryTotal) * 100);
              return (
                <View key={`${item.id ?? item.name}`} style={styles.financeRow}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={[styles.mealTitle, { color: colors.ink }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.minutes, { color: colors.muted }]}>
                    {formatMoney(item.expense, language)} · {share}%
                  </Text>
                </View>
              );
            })
          )}
          {finance ? (
            <Text style={[styles.meta, { color: colors.muted }]}>
              {t('finance.totalIncome')}: {formatMoney(monthIncome, language)} · {t('finance.totalExpense')}:{' '}
              {formatMoney(monthExpense, language)} · {t('dashboard.spentLabel')} {formatMoney(categoryTotal, language)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  helloRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 4 },
  helloCopy: { flex: 1 },
  hello: { fontSize: 28, fontWeight: '700' },
  tagline: { fontSize: 14, marginTop: 6, marginBottom: 16 },
  error: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  progressCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    width: '48%',
    flexGrow: 1,
  },
  progressTitle: { fontSize: 13 },
  progressValue: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  progressPct: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, flex: 1 },
  link: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  empty: { fontSize: 14, paddingVertical: 8 },
  taskRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    padding: 10,
  },
  check: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  checkMark: { fontWeight: '800' },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  minutes: { fontSize: 13 },
  reviewCount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  over: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  progressLabel: { fontSize: 14, marginBottom: 8 },
  waterLabel: { marginTop: 14 },
  barTrack: { borderRadius: 999, height: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  mealTitle: { flex: 1, fontSize: 14 },
  waterWrap: { marginTop: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tab: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%' },
  chartBars: { flex: 1, width: '70%', justifyContent: 'flex-end', alignItems: 'center' },
  chartPlanned: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartDone: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartLabel: { fontSize: 10, marginTop: 6 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { fontSize: 12 },
  legendMuted: { fontSize: 12 },
  materialRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    padding: 12,
  },
  materialBody: { flex: 1 },
  materialTitle: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 8 },
  financeRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { borderRadius: 999, height: 10, width: 10 },
});
