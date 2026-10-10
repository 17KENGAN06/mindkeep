import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useMemo, useRef, useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PullRefreshControl } from '../components/PullRefreshControl';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '../components/BrandMark';
import { TimezoneSuggestion } from '../components/TimezoneSuggestion';
import { selectedModules, userHasModule, type AppModule } from '../config/appModules';
import { useAuth } from '../features/auth/useAuth';
import { hasAutomation, isProAccount } from '../features/billing/planLimit';
import {
  currentPeriodDefaults,
  formatMoney,
  summarizeByCurrency,
} from '../features/finance/financeUtils';
import { useFinanceSummary } from '../features/finance/useFinance';
import { DayRings, type DayRing, type PulseStat } from '../features/home/DayRings';
import { DiscoverCard } from '../features/home/DiscoverCard';
import { NowFeed, type NowItem } from '../features/home/NowFeed';
import { OverviewTiles, type OverviewTile } from '../features/home/OverviewTiles';
import { QuickActions, type QuickAction } from '../features/home/QuickActions';
import { StarterCard, type StarterStep } from '../features/home/StarterCard';
import { useReminderSettings } from '../features/notifications/useLocalReminders';
import { useNotes } from '../features/notes/useNotes';
import { useNutritionPeriod, useSetWater } from '../features/nutrition/useNutrition';
import { useOpenQuickAdd } from '../features/quickAdd/quickAddContext';
import { useRhythmPeriod, useSetHabitCheck } from '../features/rhythm/useRhythm';
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
import { dateKeyInZone, formatWeekdayDate, hourInZone, lastNKeysFrom } from '../utils/date';
import { firstName } from '../utils/name';
import { fonts } from '../config/fonts';
import { AmbientGlow } from '../components/AmbientGlow';
import { NotificationBell, type BellTarget } from '../features/notifications/NotificationBell';
import { GlassBackground } from '../components/GlassBackground';

/** Sections suggested on a sparse Home, most useful day to day first. */
const DISCOVER_ORDER: AppModule[] = ['tasks', 'habits', 'nutrition', 'review', 'notes', 'finance'];
/** Rings that fit one row; with more, water leaves (its counter stays in quick actions). */
const MAX_RINGS = 4;

function greetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'todayHub.greeting.morning';
  if (hour >= 12 && hour < 18) return 'todayHub.greeting.day';
  if (hour >= 18 && hour < 23) return 'todayHub.greeting.evening';
  return 'todayHub.greeting.night';
}

/**
 * Home, built around the question "what do I do now?":
 * day pulse (rings, or headline numbers when no section has a daily goal) → "Now" (one
 * prioritised to-do list: reviews, tasks, habits) → quick logging → a collapsible overview →
 * on a sparse Home, an offer to add a section. Every enabled section has a place, nothing
 * repeats another block, and every block is capped so a full Home never overflows.
 */
export function TodayScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus(
    'statistics',
    'tasks',
    'nutrition',
    'finance',
    'notifications',
    'rhythm',
    'notes',
  );
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { user, updateWorkspace } = useAuth();
  const openQuickAdd = useOpenQuickAdd();
  const queryClient = useQueryClient();
  const showTasks = userHasModule(user, 'tasks');
  const showReview = userHasModule(user, 'review');
  const showNutrition = userHasModule(user, 'nutrition');
  const showFinance = userHasModule(user, 'finance');
  const showHabits = userHasModule(user, 'habits');
  const showNotes = userHasModule(user, 'notes');
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
  const rhythmQuery = useRhythmPeriod(period.year, period.month, showHabits);
  const notesQuery = useNotes({}, showNotes);
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const todayRemindersQuery = useTodayReminders();
  const overdueRemindersQuery = useOverdueReminders();
  const reminderSettings = useReminderSettings();
  const toggleTask = useToggleTask(today);
  const setWater = useSetWater(period.year, period.month);
  const setHabitCheck = useSetHabitCheck();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
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
  const habits = showHabits ? (rhythmQuery.data?.habits ?? []) : [];
  const habitsDone = habits.filter((habit) => habit.checks.includes(today)).length;
  const notes = showNotes ? (notesQuery.data ?? []) : [];

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
      showHabits
        ? {
            key: 'habits',
            label: t('todayHub.rings.habits'),
            value: `${habitsDone}/${habits.length}`,
            progress: habits.length > 0 ? habitsDone / habits.length : 0,
            onPress: () => open('Rhythm'),
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
  )
    .filter((ring): ring is DayRing => ring !== null)
    .filter((ring, _index, all) => all.length <= MAX_RINGS || ring.key !== 'water');

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

  for (const habit of habits) {
    if (habit.checks.includes(today)) continue;
    nowItems.push({ kind: 'habit', id: habit.id, title: habit.title, streak: habit.streak });
  }
  // "All done": what the day added up to, instead of an empty card.
  const doneSummary = [
    showTasks && todayDone > 0 ? `${t('todayHub.rings.tasks')} ${todayDone}` : null,
    showReview && reviewsDoneToday > 0
      ? `${t('todayHub.rings.reviews')} ${reviewsDoneToday}`
      : null,
    showHabits && habitsDone > 0 ? `${t('todayHub.rings.habits')} ${habitsDone}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
            // Never blocked: each tap shows at once and is queued (useSetWater).
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
      showTasks
        ? {
            key: 'task',
            icon: 'checkbox-outline' as const,
            label: t('todayHub.quick.task'),
            onPress: () => openQuickAdd({ task: true }),
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
      showNotes
        ? {
            key: 'note',
            icon: 'document-text-outline' as const,
            label: t('todayHub.quick.note'),
            onPress: () => open('NoteCreate'),
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
  const spendValue = mainExpense
    ? formatMoney(mainExpense.expense, language, mainExpense.currency)
    : null;
  // Without rings (only budget / notes on) the pulse card shows these headline numbers instead,
  // and the summary leaves them out so nothing appears twice.
  const pulseStats: PulseStat[] =
    rings.length === 0
      ? ([
          showFinance
            ? {
                key: 'spend',
                icon: 'wallet-outline',
                label: t('todayHub.overview.spend'),
                value: spendValue ?? t('todayHub.overview.noExpenses'),
                muted: !spendValue,
                onPress: () => open('Finance'),
              }
            : null,
          showNotes
            ? {
                key: 'notes',
                icon: 'document-text-outline',
                label: t('todayHub.overview.notes'),
                value: String(notes.length),
                onPress: () => open('Notes'),
              }
            : null,
        ].filter((stat) => stat !== null) as PulseStat[])
      : [];
  const inPulse = new Set(pulseStats.map((stat) => stat.key));
  const bestStreak = habits.reduce((best, habit) => Math.max(best, habit.streak), 0);
  const weekDone = weekTasks.filter((task) => task.completed).length;
  // Average calories over the days of the last week that have meals logged.
  const weekKcalByDay = new Map<string, number>();
  for (const meal of nutritionQuery.data?.meals ?? []) {
    if (!weekDays.includes(meal.date)) continue;
    weekKcalByDay.set(meal.date, (weekKcalByDay.get(meal.date) ?? 0) + meal.calories);
  }
  const weekKcal = [...weekKcalByDay.values()];
  const avgKcal =
    weekKcal.length > 0
      ? Math.round(weekKcal.reduce((sum, value) => sum + value, 0) / weekKcal.length)
      : 0;
  // "Summary": one tile per section, each with its own clear period in the caption.
  const overviewTiles = (
    [
      showTasks
        ? {
            key: 'tasks',
            icon: 'checkbox-outline' as const,
            label: t('todayHub.overview.tasks'),
            value: `${weekDone}/${weekTasks.length}`,
            caption: t('todayHub.overview.tasksCaption'),
            progress: weekTasks.length > 0 ? weekDone / weekTasks.length : 0,
            onPress: () => open('Statistics'),
          }
        : null,
      showReview
        ? {
            key: 'reviews',
            icon: 'school-outline' as const,
            label: t('todayHub.overview.reviews'),
            value: String(weekReviews),
            caption: t('todayHub.overview.reviewsCaption'),
            muted: weekReviews === 0,
            onPress: () => open('Statistics'),
          }
        : null,
      showHabits && habits.length > 0
        ? {
            key: 'streak',
            icon: 'flame-outline' as const,
            label: t('todayHub.overview.habits'),
            value: String(bestStreak),
            caption: t('todayHub.overview.streakCaption'),
            muted: bestStreak === 0,
            onPress: () => open('Rhythm'),
          }
        : null,
      showNutrition
        ? {
            key: 'kcal',
            icon: 'restaurant-outline' as const,
            label: t('todayHub.overview.nutrition'),
            value: avgKcal > 0 ? String(avgKcal) : '—',
            caption: t('todayHub.overview.kcalCaption'),
            muted: avgKcal === 0,
            onPress: () => open('Fuel'),
          }
        : null,
      showFinance && !inPulse.has('spend')
        ? {
            key: 'spend',
            icon: 'wallet-outline' as const,
            label: t('todayHub.overview.spend'),
            value: spendValue ?? '0',
            caption: spendValue
              ? t('todayHub.overview.spendCaption')
              : t('todayHub.overview.noExpenses'),
            muted: !spendValue,
            onPress: () => open('Finance'),
          }
        : null,
    ] as (OverviewTile | null)[]
  ).filter((tile): tile is OverviewTile => tile !== null);

  // --- Sparse Home: offer one more section ------------------------------------------------------
  const enabledModules = selectedModules(user);
  const discoverModules =
    enabledModules.length <= 2
      ? DISCOVER_ORDER.filter((module) => !enabledModules.includes(module))
      : [];
  const enableModule = async (module: AppModule) => {
    await updateWorkspace({ enabledModules: [...enabledModules, module] });
  };

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
    overdueRemindersQuery.isRefetching ||
    rhythmQuery.isRefetching ||
    notesQuery.isRefetching;
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
    if (showHabits) void rhythmQuery.refetch();
    if (showNotes) void notesQuery.refetch();
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

  const onCheckHabit = async (habitId: string) => {
    setBusyHabitId(habitId);
    setActionError(false);
    try {
      await setHabitCheck.mutateAsync({ habitId, date: today, done: true });
    } catch {
      setActionError(true);
    } finally {
      setBusyHabitId(null);
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

  const showFeed = showTasks || showReview || showHabits;
  // Two lines so a long name never gets cut mid-phrase: a small "Good afternoon" over the name
  // in large type (which shrinks to fit). The phrase is the greeting with the name left out.
  const greetingName = firstName(user?.name);
  const greetingPhrase = t(greetingKey(hourInZone(new Date(), timeZone)), { name: '' })
    .replace(/[\s,،]+$/u, '')
    .trim();
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <PullRefreshControl
              busy={refreshing && !loading}
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
              <Text style={[styles.helloPhrase, { color: colors.muted }]} numberOfLines={1}>
                {greetingName ? `${greetingPhrase},` : greetingPhrase}
              </Text>
              {greetingName ? (
                <Text
                  style={[styles.hello, { color: colors.ink }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {greetingName}
                </Text>
              ) : null}
              <View style={styles.subRow}>
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
                    style={[
                      styles.planChipText,
                      { color: entitled ? colors.onBrand : colors.muted },
                    ]}
                  >
                    {entitled ? t('dashboard.planPro') : t('dashboard.planFree')}
                  </Text>
                </Pressable>
                <Text style={[styles.date, { color: colors.muted }]} numberOfLines={1}>
                  {formatWeekdayDate(today, language)}
                </Text>
              </View>
            </View>
            <NotificationBell onOpen={openBellTarget} />
          </View>
          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{t('today.error')}</Text>
          ) : null}

          <DayRings rings={rings} stats={pulseStats} />

          {starterInsteadOfFeed ? <StarterCard steps={starterSteps} /> : null}
          {showFeed && !starterInsteadOfFeed ? (
            <NowFeed
              items={nowItems}
              doneToday={todayDone}
              doneSummary={doneSummary || null}
              busyTaskId={busyTaskId}
              onToggleTask={(id) => void onToggle(id)}
              busyHabitId={busyHabitId}
              onCheckHabit={(id) => void onCheckHabit(id)}
              onOpenHabits={() => open('Rhythm')}
              onOpenReview={(materialId) => open('MaterialDetail', { id: materialId })}
              onOpenReviews={() => open('ReviewInbox')}
              onOpenTasks={() => open('TasksHome')}
            />
          ) : null}

          <QuickActions actions={quickActions} />

          {/* A new account that already has something to do still sees its checklist, lower down. */}
          {isNewAccount && !starterInsteadOfFeed ? <StarterCard steps={starterSteps} /> : null}

          <OverviewTiles tiles={overviewTiles} />

          <DiscoverCard
            modules={discoverModules}
            onEnable={enableModule}
            onOpenSettings={() => open('Settings')}
          />
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
  helloCopy: { alignItems: 'flex-start', flex: 1, minWidth: 0 },
  helloPhrase: { fontFamily: fonts.medium, fontSize: 13.5, maxWidth: '100%' },
  hello: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 30,
    maxWidth: '100%',
  },
  subRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 6, maxWidth: '100%' },
  date: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12.5 },
  planChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planChipText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  error: { fontFamily: fonts.medium, marginBottom: 12 },
});
