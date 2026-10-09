import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useMemo, useRef, useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../components/BrandMark';
import { TimezoneSuggestion } from '../components/TimezoneSuggestion';
import { userHasModule } from '../config/appModules';
import { useAuth } from '../features/auth/useAuth';
import { hasAutomation, isProAccount } from '../features/billing/planLimit';
import {
  currentPeriodDefaults,
  formatMoney,
  summarizeByCurrency,
} from '../features/finance/financeUtils';
import { useFinanceSummary } from '../features/finance/useFinance';
import { DayRings, type DayRing } from '../features/home/DayRings';
import { NowFeed, type NowItem } from '../features/home/NowFeed';
import { OverviewTiles, type OverviewTile } from '../features/home/OverviewTiles';
import { QuickActions, type QuickAction } from '../features/home/QuickActions';
import { StarterCard, type StarterStep } from '../features/home/StarterCard';
import { useReminderSettings } from '../features/notifications/useLocalReminders';
import { useNutritionPeriod, useSetWater } from '../features/nutrition/useNutrition';
import { useOverdueReminders, useTodayReminders } from '../features/reminders/useReminders';
import {
  useActivityStatistics,
  useDashboardStatistics,
} from '../features/statistics/useStatistics';
import { useTasksPeriod, useTodayTasks, useToggleTask } from '../features/tasks/useDailyTasks';
import { useRefreshOnFocus } from '../features/sync/useRefreshOnFocus';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import { openSectionFromHome } from '../navigation/openSection';
import type { AppTabParamList, MoreStackParamList } from '../navigation/types';
import { useAccountToday } from '../features/time/useAccountToday';
import { dateKeyInZone, lastNKeysFrom } from '../utils/date';
import { firstName } from '../utils/name';
import { fonts } from '../config/fonts';
import { AmbientGlow } from '../components/AmbientGlow';
import { NotificationBell, type BellTarget } from '../features/notifications/NotificationBell';
import { GlassBackground } from '../components/GlassBackground';

/**
 * Home, built around the question "what do I do now?":
 * rings (progress at a glance) → "Now" (one prioritised to-do list) → quick logging →
 * a collapsible overview. Details live in the sections; nothing here repeats another block.
 */
export function TodayScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('statistics', 'tasks', 'nutrition', 'finance', 'notifications');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const showTasks = userHasModule(user, 'tasks');
  const showReview = userHasModule(user, 'review');
  const showNutrition = userHasModule(user, 'nutrition');
  const showFinance = userHasModule(user, 'finance');
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const insets = useSafeAreaInsets();
  // The status-bar strip turns into frosted glass as soon as the page scrolls under it.
  const scrollY = useRef(new Animated.Value(0)).current;
  const statusGlass = scrollY.interpolate({
    inputRange: [0, 16],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const blurTarget = useRef<View>(null);
  const { today, timeZone } = useAccountToday();
  const period = currentPeriodDefaults(today);
  const weekDays = useMemo(() => lastNKeysFrom(today, 7), [today]);

  const tasksQuery = useTodayTasks(today, showTasks);
  const monthTasksQuery = useTasksPeriod(period.year, period.month, showTasks);
  const prevMonth = period.month === 1 ? 12 : period.month - 1;
  const prevYear = period.month === 1 ? period.year - 1 : period.year;
  const prevTasksQuery = useTasksPeriod(prevYear, prevMonth, showTasks);
  const nutritionQuery = useNutritionPeriod(period.year, period.month, showNutrition);
  const financeQuery = useFinanceSummary(period, showFinance);
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const todayRemindersQuery = useTodayReminders();
  const overdueRemindersQuery = useOverdueReminders();
  const reminderSettings = useReminderSettings();
  const toggleTask = useToggleTask(today);
  const setWater = useSetWater(period.year, period.month);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  // Sections opened from Home return here with their back arrow (not to the Sections hub).
  const open = <S extends keyof MoreStackParamList>(screen: S, params?: MoreStackParamList[S]) =>
    openSectionFromHome(navigation, screen, params);

  // --- Day numbers -------------------------------------------------------------------------
  const tasks = tasksQuery.data?.tasks ?? [];
  const todayDone = tasks.filter((task) => task.completed).length;
  const meals = (nutritionQuery.data?.meals ?? []).filter((meal) => meal.date === today);
  const calorieGoal = nutritionQuery.data?.settings.calorieGoal ?? 2000;
  const waterGoal = nutritionQuery.data?.settings.waterGoal ?? 8;
  const glasses = nutritionQuery.data?.water.find((row) => row.date === today)?.glasses ?? 0;
  const eaten = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const stats = dashboardQuery.data?.stats;
  const reviewsLeft = (stats?.todayReminders ?? 0) + (stats?.overdueReminders ?? 0);
  // Reviews done today (activity is per day), so the ring compares today with today.
  const reviewsDoneToday =
    activityQuery.data?.activity.find((point) => point.date === today)?.count ?? 0;
  const reviewsPlanned = reviewsDoneToday + reviewsLeft;

  const rings = (
    [
      showTasks
        ? {
            key: 'tasks',
            label: t('todayHub.rings.tasks'),
            value: `${todayDone}/${tasks.length}`,
            progress: tasks.length > 0 ? todayDone / tasks.length : 0,
            onPress: () => open('TasksHome'),
          }
        : null,
      showReview
        ? {
            key: 'reviews',
            label: t('todayHub.rings.reviews'),
            value: `${reviewsDoneToday}/${reviewsPlanned}`,
            progress: reviewsPlanned > 0 ? reviewsDoneToday / reviewsPlanned : 0,
            onPress: () => open('ReviewInbox'),
          }
        : null,
      showNutrition
        ? {
            key: 'calories',
            label: t('todayHub.rings.calories'),
            value: `${Math.round((eaten / Math.max(calorieGoal, 1)) * 100)}%`,
            progress: eaten / Math.max(calorieGoal, 1),
            over: eaten > calorieGoal,
            onPress: () => open('Fuel'),
          }
        : null,
      showNutrition
        ? {
            key: 'water',
            label: t('todayHub.rings.water'),
            value: `${glasses}/${waterGoal}`,
            progress: glasses / Math.max(waterGoal, 1),
            onPress: () => open('Fuel'),
          }
        : null,
    ] as (DayRing | null)[]
  ).filter((ring): ring is DayRing => ring !== null);

  // --- "Now": most urgent first ----------------------------------------------------------------
  const nowItems: NowItem[] = [];
  if (showReview) {
    const overdue = [...(overdueRemindersQuery.data ?? [])].sort(
      (a, b) => b.daysOverdue - a.daysOverdue,
    );
    for (const reminder of overdue) {
      nowItems.push({
        kind: 'overdue',
        id: reminder.id,
        title: reminder.material.title,
        materialId: reminder.material.id,
      });
    }
  }
  const openTasks = showTasks ? tasks.filter((task) => !task.completed) : [];
  for (const task of openTasks.filter((item) => item.important)) {
    nowItems.push({
      kind: 'task',
      id: task.id,
      title: task.title,
      minutes: task.minutes,
      important: true,
    });
  }
  if (showReview) {
    for (const reminder of todayRemindersQuery.data ?? []) {
      if (reminder.status !== 'PENDING') continue;
      nowItems.push({
        kind: 'review',
        id: reminder.id,
        title: reminder.material.title,
        materialId: reminder.material.id,
      });
    }
  }
  for (const task of openTasks.filter((item) => !item.important)) {
    nowItems.push({
      kind: 'task',
      id: task.id,
      title: task.title,
      minutes: task.minutes,
      important: false,
    });
  }

  // --- Quick logging ---------------------------------------------------------------------------
  const onAddWater = () => {
    setActionError(false);
    void setWater
      .mutateAsync({ date: today, glasses: glasses + 1 })
      .catch(() => setActionError(true));
  };
  const quickActions = (
    [
      showNutrition
        ? {
            key: 'water',
            icon: 'water-outline' as const,
            label: t('todayHub.quick.water'),
            value: `${glasses}/${waterGoal}`,
            busy: setWater.isPending,
            onPress: onAddWater,
          }
        : null,
      showNutrition && hasAutomation(user)
        ? {
            key: 'scan',
            icon: 'camera-outline' as const,
            label: t('todayHub.quick.scan'),
            onPress: () => open('Fuel', { openScan: Date.now() }),
          }
        : null,
      showNutrition
        ? {
            key: 'meal',
            icon: 'restaurant-outline' as const,
            label: t('todayHub.quick.meal'),
            onPress: () => open('Fuel'),
          }
        : null,
      showFinance
        ? {
            key: 'expense',
            icon: 'wallet-outline' as const,
            label: t('todayHub.quick.expense'),
            onPress: () => open('Finance'),
          }
        : null,
    ] as (QuickAction | null)[]
  ).filter((action): action is QuickAction => action !== null);

  // --- Overview tiles --------------------------------------------------------------------------
  const weekTaskPool = [
    ...(monthTasksQuery.data?.tasks ?? []),
    ...(prevTasksQuery.data?.tasks ?? []),
  ];
  const weekTasks = weekTaskPool.filter((task) => weekDays.includes(task.date));
  const weekReviews = weekDays.reduce(
    (sum, date) =>
      sum + (activityQuery.data?.activity.find((point) => point.date === date)?.count ?? 0),
    0,
  );
  const mainExpense = summarizeByCurrency(financeQuery.data?.operations ?? []).find(
    (bucket) => bucket.expense > 0,
  );
  const overviewTiles = (
    [
      showNutrition
        ? {
            key: 'nutrition',
            icon: 'restaurant-outline' as const,
            label: t('todayHub.overview.nutrition'),
            value: `${eaten} ${t('today.kcal')}`,
            onPress: () => open('Fuel'),
          }
        : null,
      showFinance
        ? {
            key: 'finance',
            icon: 'wallet-outline' as const,
            label: t('todayHub.overview.finance'),
            value: mainExpense
              ? formatMoney(mainExpense.expense, language, mainExpense.currency)
              : t('todayHub.overview.noExpenses'),
            muted: !mainExpense,
            onPress: () => open('Finance'),
          }
        : null,
      showTasks || showReview
        ? {
            key: 'week',
            icon: 'stats-chart-outline' as const,
            label: t('todayHub.overview.week'),
            value: showTasks
              ? t('todayHub.overview.weekValue', {
                  done: weekTasks.filter((task) => task.completed).length,
                  total: weekTasks.length,
                })
              : String(weekReviews),
            onPress: () => open('Statistics'),
          }
        : null,
    ] as (OverviewTile | null)[]
  ).filter((tile): tile is OverviewTile => tile !== null);

  // --- First days ------------------------------------------------------------------------------
  const hasAnyTask = tasks.length > 0 || weekTaskPool.length > 0;
  const starterSteps = (
    [
      showTasks
        ? {
            key: 'task',
            label: t('todayHub.start.task'),
            done: hasAnyTask,
            onPress: () => open('TasksHome'),
          }
        : null,
      showReview
        ? {
            key: 'material',
            label: t('todayHub.start.material'),
            done: (stats?.activeMaterials ?? 0) > 0,
            onPress: () => open('MaterialCreate'),
          }
        : null,
      {
        key: 'reminders',
        label: t('todayHub.start.reminders'),
        done: Boolean(reminderSettings?.enabled),
        onPress: () => open('Settings'),
      },
    ] as (StarterStep | null)[]
  ).filter((step): step is StarterStep => step !== null);
  // Only for genuinely new accounts: an established one never gets the checklist pushed at it.
  const accountAgeDays = user?.createdAt
    ? Math.round(
        (Date.parse(`${today}T12:00:00Z`) -
          Date.parse(`${dateKeyInZone(new Date(user.createdAt), timeZone)}T12:00:00Z`)) /
          86_400_000,
      )
    : 0;
  const isNewAccount =
    accountAgeDays <= 14 && (!stats || stats.activeMaterials === 0 || !hasAnyTask);

  // --- Loading, refresh, actions ---------------------------------------------------------------
  const loading =
    dashboardQuery.isLoading ||
    (showTasks && tasksQuery.isLoading) ||
    (showNutrition && nutritionQuery.isLoading);
  const refreshing =
    dashboardQuery.isRefetching ||
    tasksQuery.isRefetching ||
    nutritionQuery.isRefetching ||
    financeQuery.isRefetching ||
    activityQuery.isRefetching ||
    todayRemindersQuery.isRefetching ||
    overdueRemindersQuery.isRefetching;
  const error =
    actionError ||
    dashboardQuery.isError ||
    (showTasks && tasksQuery.isError) ||
    (showNutrition && nutritionQuery.isError);

  const onRefresh = () => {
    setActionError(false);
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['billing'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void tasksQuery.refetch();
    void nutritionQuery.refetch();
    void dashboardQuery.refetch();
    void activityQuery.refetch();
    void financeQuery.refetch();
    void monthTasksQuery.refetch();
    void prevTasksQuery.refetch();
    void todayRemindersQuery.refetch();
    void overdueRemindersQuery.refetch();
  };

  const onToggle = async (id: string) => {
    setBusyTaskId(id);
    setActionError(false);
    try {
      await toggleTask.mutateAsync({ id, completed: true });
    } catch {
      setActionError(true);
    } finally {
      setBusyTaskId(null);
    }
  };

  const entitled = isProAccount(user);
  const openBellTarget = (target: BellTarget) =>
    'params' in target ? open(target.screen, target.params) : open(target.screen);

  if (loading && !tasksQuery.data && !nutritionQuery.data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <AmbientGlow />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const showFeed = showTasks || showReview;
  // New account with nothing planned yet: the checklist takes the empty "Now" card's place.
  const starterInsteadOfFeed =
    isNewAccount && nowItems.length === 0 && starterSteps.some((step) => !step.done);

  return (
    // Top edge handled by hand, so the glass strip can reach under the status bar.
    <SafeAreaView edges={['left', 'right']} style={[styles.safe, { backgroundColor: colors.bg }]}>
      <BlurTargetView ref={blurTarget} style={styles.safe}>
        <AmbientGlow />
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing && !loading}
              onRefresh={onRefresh}
              tintColor={colors.brand}
              progressViewOffset={insets.top}
            />
          }
        >
          <TimezoneSuggestion />
          {/* Header like the site's mobile dashboard: logo · greeting + plan · bell, on one line. */}
          <View style={styles.helloRow}>
            <BrandMark size={46} />
            <View style={styles.helloCopy}>
              <Text style={[styles.hello, { color: colors.ink }]} numberOfLines={1}>
                {t('today.hello', { name: firstName(user?.name) })}
              </Text>
              <Pressable
                onPress={() => open('Account')}
                style={[
                  styles.planChip,
                  entitled
                    ? { backgroundColor: colors.brand }
                    : {
                        backgroundColor: `${colors.panel}e6`,
                        borderColor: colors.line,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[styles.planChipText, { color: entitled ? colors.onBrand : colors.muted }]}
                >
                  {entitled ? t('dashboard.planPro') : t('dashboard.planFree')}
                </Text>
              </Pressable>
            </View>
            <NotificationBell onOpen={openBellTarget} />
          </View>
          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{t('today.error')}</Text>
          ) : null}

          <DayRings rings={rings} />

          {starterInsteadOfFeed ? <StarterCard steps={starterSteps} /> : null}
          {showFeed && !starterInsteadOfFeed ? (
            <NowFeed
              items={nowItems}
              doneToday={todayDone}
              busyTaskId={busyTaskId}
              onToggleTask={(id) => void onToggle(id)}
              onOpenReview={(materialId) => open('MaterialDetail', { id: materialId })}
              onOpenReviews={() => open('ReviewInbox')}
              onOpenTasks={() => open('TasksHome')}
            />
          ) : null}

          <QuickActions actions={quickActions} />

          {/* A new account that already has something to do still sees its checklist, lower down. */}
          {isNewAccount && !starterInsteadOfFeed ? <StarterCard steps={starterSteps} /> : null}

          <OverviewTiles tiles={overviewTiles} />
        </Animated.ScrollView>
      </BlurTargetView>
      {/* Status-bar strip: once the page scrolls up under the clock and battery, it turns into
          frosted glass instead of cutting the content off at a solid black band. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.statusGlass, { height: insets.top, opacity: statusGlass }]}
      >
        <GlassBackground target={blurTarget} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40, width: '100%' },
  statusGlass: { left: 0, position: 'absolute', right: 0, top: 0, zIndex: 10 },
  helloRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    maxWidth: '100%',
  },
  helloCopy: { alignItems: 'flex-start', flex: 1, gap: 6, minWidth: 0 },
  hello: { fontSize: 21, fontFamily: fonts.display, letterSpacing: -0.4, maxWidth: '100%' },
  planChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planChipText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  error: { fontFamily: fonts.medium, marginBottom: 12 },
});
