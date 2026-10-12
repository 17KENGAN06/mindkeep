import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PullRefreshControl } from '../components/PullRefreshControl';
import { SectionScrollView } from '../components/SectionScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MonthGrid } from '../components/MonthGrid';
import { AppIcon } from '../components/AppIcon';
import { AppButton } from '../components/ui';
import { TaskCardShell, TaskCheck } from '../components/TaskMotion';
import { ApiError } from '../api/client';
import { mapAuthError } from '../features/auth/mapAuthError';
import { TaskCopyModal } from '../features/tasks/TaskCopyModal';
import { TaskImportModal } from '../features/tasks/TaskImportModal';
import { ForestCard } from '../components/forest/ForestCard';
import {
  useBulkCreateTasks,
  useCopyTasks,
  useCreateTask,
  useDeleteTask,
  useForestSummary,
  useTasksPeriod,
  useToggleTask,
  useUpdateTask,
} from '../features/tasks/useDailyTasks';
import { useRefreshOnFocus } from '../features/sync/useRefreshOnFocus';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { TasksStackParamList } from '../navigation/types';
import type { CalendarDaySummary } from '../types/calendar';
import type { DailyTask } from '../types/dailyTask';
import { useAccountToday, useTodayRollover } from '../features/time/useAccountToday';
import { formatDate, formatMonthTitle } from '../utils/date';
import { fonts } from '../config/fonts';
import { AmbientGlow } from '../components/AmbientGlow';

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split('-').map(Number);
  return y === year && m === month;
}

export function TasksScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('tasks');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { today, year: todayYear, month: todayMonth } = useAccountToday();
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  // At midnight, move along only if the user was still looking at the old "today".
  useTodayRollover(today, (previous, next) => {
    if (selectedDate !== previous) return;
    setSelectedDate(next);
    setYear(Number(next.slice(0, 4)));
    setMonth(Number(next.slice(5, 7)));
  });
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Quick add's Import / Copy day: open the dialog once per request timestamp.
  const route = useRoute<RouteProp<TasksStackParamList, 'TasksHome'>>();
  const handledRequest = useRef<number | undefined>(undefined);
  const scrollRef = useRef<ScrollView>(null);
  const dayListY = useRef(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // A task (or just a day) to bring into view once its month has loaded and its card is laid out.
  const focusRequest = useRef<{ date: string; taskId: string | null } | null>(null);
  const focusTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardY = useRef(new Map<string, number>());
  useEffect(() => () => focusTimers.current.forEach(clearTimeout), []);
  const scrollToFocus = (readY: () => number) => {
    focusRequest.current = null;
    focusTimers.current.forEach(clearTimeout);
    focusTimers.current = [
      // Leave room for the header above, so the card lands in the upper part of the screen.
      setTimeout(
        () => scrollRef.current?.scrollTo({ y: Math.max(readY() - 140, 0), animated: true }),
        120,
      ),
      setTimeout(() => setHighlightId(null), 4500),
    ];
  };
  useEffect(() => {
    const request = route.params;
    if (request?.at === undefined || handledRequest.current === request.at) return;
    // Opened from the bell / notifications / a reminder: show that day and scroll to the task.
    if (request.date && /^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
      handledRequest.current = request.at;
      const date = request.date;
      setSelectedDate(date);
      setYear(Number(date.slice(0, 4)));
      setMonth(Number(date.slice(5, 7)));
      setHighlightId(request.taskId ?? null);
      focusRequest.current = { date, taskId: request.taskId ?? null };
      return;
    }
    if (!request.open) return;
    handledRequest.current = request.at;
    if (request.open === 'import') {
      setImportError(null);
      setImportOpen(true);
    } else {
      setCopyError(null);
      setCopyOpen(true);
    }
  }, [route.params]);

  const periodQuery = useTasksPeriod(year, month);
  const toggleTask = useToggleTask(selectedDate);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(selectedDate);
  const deleteTask = useDeleteTask();
  const bulkCreate = useBulkCreateTasks();
  const copyTasks = useCopyTasks();
  const forestQuery = useForestSummary(year, month);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMinutes('30');
    setFormError(null);
  };

  useEffect(() => {
    setEditingId(null);
    setTitle('');
    setMinutes('30');
    setFormError(null);
  }, [selectedDate]);

  const calendarDays: CalendarDaySummary[] = useMemo(
    () =>
      (periodQuery.data?.days ?? []).map((day) => ({
        date: day.date,
        total: day.total,
        overdue: day.overdue,
        pending: day.pending,
        completed: day.completed,
        skipped: 0,
        important: day.important ?? 0,
      })),
    [periodQuery.data?.days],
  );

  const dayTasks = [...(periodQuery.data?.tasks ?? [])]
    .filter((task) => task.date === selectedDate)
    // Ticking a task no longer sends it to the bottom: the list stays put under the finger.
    .sort((left, right) => {
      if (Boolean(left.important) !== Boolean(right.important)) return left.important ? -1 : 1;
      return 0;
    });

  // Cards that are new since the last render of the same day fade in; switching days does not.
  const seenIds = useRef<Set<string> | null>(null);
  const seenDate = useRef(selectedDate);
  const isNewCard = (id: string) =>
    seenIds.current !== null && seenDate.current === selectedDate && !seenIds.current.has(id);
  const dayTaskIds = dayTasks.map((task) => task.id).join(',');
  useEffect(() => {
    const ids = dayTaskIds ? dayTaskIds.split(',') : [];
    if (seenIds.current === null || seenDate.current !== selectedDate) {
      seenDate.current = selectedDate;
      seenIds.current = new Set(ids);
      return;
    }
    for (const id of ids) seenIds.current.add(id);
  }, [dayTaskIds, selectedDate]);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  // Bring the requested task into view: at once if its card is already laid out, otherwise its
  // card's onMeasured does it. A task that is gone (deleted, moved) falls back to the day's list.
  useEffect(() => {
    const request = focusRequest.current;
    if (!request || request.date !== selectedDate || !periodQuery.data) return;
    if (request.taskId && dayTaskIds.split(',').includes(request.taskId)) {
      const y = cardY.current.get(request.taskId);
      if (y !== undefined) scrollToFocus(() => y);
      return;
    }
    // Not in the cached month: wait for the fresh one before giving up on the task.
    if (periodQuery.isFetching) return;
    setHighlightId(null);
    scrollToFocus(() => dayListY.current);
  }, [route.params, selectedDate, dayTaskIds, periodQuery.data, periodQuery.isFetching]);

  const onImport = async (tasks: { title: string; minutes: number }[]) => {
    setImportError(null);
    try {
      await bulkCreate.mutateAsync({ date: selectedDate, tasks });
      setImportOpen(false);
    } catch (caught) {
      setImportError(mapAuthError(caught, t));
    }
  };

  const onCopy = async (dates: string[]) => {
    setCopyError(null);
    try {
      await copyTasks.mutateAsync({ from: selectedDate, to: dates });
      setCopyOpen(false);
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : null;
      if (code === 'COPY_EMPTY') {
        setCopyError(t('tasks.errors.copyEmpty'));
        return;
      }
      if (code === 'COPY_NO_DAYS') {
        setCopyError(t('tasks.errors.copyNoDays'));
        return;
      }
      setCopyError(mapAuthError(caught, t));
    }
  };

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

  const onStartEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setMinutes(String(task.minutes));
    setFormError(null);
  };

  const onSave = async () => {
    setFormError(null);
    if (!title.trim()) {
      setFormError(t('tasks.errors.title'));
      return;
    }
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 1) {
      setFormError(t('tasks.errors.minutes'));
      return;
    }
    try {
      if (editingId) {
        await updateTask.mutateAsync({
          id: editingId,
          payload: { title: title.trim(), minutes: Math.round(mins) },
        });
      } else {
        await createTask.mutateAsync({
          title: title.trim(),
          minutes: Math.round(mins),
          date: selectedDate,
        });
      }
      resetForm();
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    }
  };

  const onToggle = async (task: DailyTask) => {
    setBusyId(task.id);
    setFormError(null);
    try {
      await toggleTask.mutateAsync({ id: task.id, completed: !task.completed });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const onImportant = async (task: DailyTask) => {
    setBusyId(task.id);
    setFormError(null);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { important: !task.important },
      });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const onSplit = async (task: DailyTask, splitCount: number) => {
    setBusyId(task.id);
    setPickingId(null);
    setFormError(null);
    try {
      await updateTask.mutateAsync({ id: task.id, payload: { splitCount, splitDone: 0 } });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const onSetPart = async (task: DailyTask, splitDone: number) => {
    setBusyId(task.id);
    setFormError(null);
    try {
      await updateTask.mutateAsync({ id: task.id, payload: { splitDone } });
    } catch (caught) {
      setFormError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (task: DailyTask) => {
    Alert.alert(t('tasks.deleteTitle'), t('tasks.deleteDescription', { title: task.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setBusyId(task.id);
          setFormError(null);
          // The card animates out (TaskCardShell) and the request starts when it is gone.
          setLeavingId(task.id);
        },
      },
    ]);
  };

  const removeTask = (task: DailyTask) => {
    void deleteTask
      .mutateAsync(task.id)
      .then(() => {
        if (editingId === task.id) resetForm();
      })
      .catch((caught) => setFormError(mapAuthError(caught, t)))
      .finally(() => {
        setLeavingId(null);
        setBusyId(null);
      });
  };

  if (periodQuery.isLoading && !periodQuery.data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
        <AmbientGlow />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['left', 'right']}>
      <AmbientGlow />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SectionScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <PullRefreshControl
              busy={periodQuery.isRefetching && !periodQuery.isLoading}
              onRefresh={() => void periodQuery.refetch()}
              tintColor={colors.brand}
            />
          }
        >
          <Text style={[styles.title, { color: colors.ink }]}>{t('tasks.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{t('tasks.subtitle')}</Text>
          <Pressable
            onPress={() => navigation.navigate('MonthPlan')}
            style={[styles.planLink, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <AppIcon name="calendar-outline" color={colors.brand} size={18} />
            <Text style={[styles.planLinkText, { color: colors.brand }]}>{t('tasks.planTitle')}</Text>
          </Pressable>

          {forestQuery.data ? (
            <ForestCard
              totalCompleted={forestQuery.data.totalCompleted}
              completedToday={forestQuery.data.completedToday}
              monthLabel={formatMonthTitle(year, month, language)}
              onExplore={() => navigation.navigate('Forest', { year, month })}
            />
          ) : null}

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

          <Text
            style={[styles.dayTitle, { color: colors.ink }]}
            onLayout={(event) => {
              dayListY.current = event.nativeEvent.layout.y;
            }}
          >
            {t('tasks.dayTitle', { date: formatDate(selectedDate, language) })}
          </Text>

          {dayTasks.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('tasks.empty')}</Text>
          ) : (
            dayTasks.map((task) => {
              const splitCount = Math.max(1, task.splitCount ?? 1);
              const splitDone = Math.min(splitCount, Math.max(0, task.splitDone ?? 0));
              return (
                <TaskCardShell
                  key={task.id}
                  appear={isNewCard(task.id)}
                  leaving={leavingId === task.id}
                  onLeft={() => removeTask(task)}
                  onMeasured={(y) => {
                    cardY.current.set(task.id, y);
                    const request = focusRequest.current;
                    if (request?.taskId === task.id && request.date === selectedDate) {
                      scrollToFocus(() => y);
                    }
                  }}
                  style={[
                    styles.taskCard,
                    { backgroundColor: colors.panel, borderColor: colors.line },
                    task.completed && { borderColor: `${colors.brand}59` },
                    task.important && !task.completed && { borderColor: '#e0a020' },
                    editingId === task.id && { borderColor: colors.brand },
                    highlightId === task.id && {
                      backgroundColor: `${colors.brand}1a`,
                      borderColor: colors.brand,
                    },
                  ]}
                >
                  <View style={styles.taskRow}>
                    <Pressable
                      disabled={busyId === task.id}
                      onPress={() => void onToggle(task)}
                      style={styles.taskMain}
                    >
                      <TaskCheck checked={task.completed} borderColor={colors.line} />
                      <View style={styles.taskCopy}>
                        <Text
                          style={[
                            styles.taskTitle,
                            { color: colors.ink },
                            task.completed && { color: colors.muted, textDecorationLine: 'line-through' },
                          ]}
                        >
                          {task.title}
                        </Text>
                        <Text style={[styles.minutes, { color: colors.muted }]}>
                          {task.minutes} {t('today.min')}
                        </Text>
                      </View>
                    </Pressable>
                    <View style={styles.taskActions}>
                      <Pressable
                        disabled={busyId === task.id}
                        onPress={() => void onImportant(task)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          task.important ? t('tasks.unmarkImportant') : t('tasks.markImportant')
                        }
                        accessibilityHint={t('tasks.importantHint')}
                        style={[
                          styles.importantBtn,
                          task.important
                            ? { backgroundColor: '#f0b429', borderColor: '#e0a020' }
                            : { borderColor: colors.line, backgroundColor: colors.bg },
                        ]}
                      >
                        <AppIcon
                          name={task.important ? 'flag' : 'flag-outline'}
                          color={task.important ? '#3a2a08' : colors.muted}
                          size={16}
                        />
                        <Text
                          style={[
                            styles.importantLabel,
                            { color: task.important ? '#3a2a08' : colors.muted },
                          ]}
                        >
                          {t('tasks.important')}
                        </Text>
                      </Pressable>
                      <AppButton
                        variant="ghost"
                        label={t('common.edit')}
                        disabled={busyId === task.id}
                        onPress={() => onStartEdit(task)}
                      />
                      <AppButton
                        variant="ghost"
                        label={t('common.delete')}
                        disabled={busyId === task.id || deleteTask.isPending}
                        onPress={() => onDelete(task)}
                      />
                    </View>
                  </View>
                  {splitCount > 1 ? (
                    <View style={styles.splitRow}>
                      {Array.from({ length: splitCount }, (_, index) => {
                        const step = index + 1;
                        const filled = step <= splitDone;
                        return (
                          <Pressable
                            key={step}
                            disabled={busyId === task.id}
                            onPress={() => void onSetPart(task, splitDone === step ? step - 1 : step)}
                            style={[
                              styles.splitChip,
                              { backgroundColor: filled ? colors.brand : `${colors.brand}22` },
                            ]}
                          >
                            <Text style={[styles.splitChipText, { color: filled ? colors.onBrand : colors.ink }]}>
                              {step}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Text style={[styles.splitLabel, { color: colors.brand }]}>
                        {t('tasks.splitProgress', { done: splitDone, count: splitCount })}
                      </Text>
                      <Pressable disabled={busyId === task.id} onPress={() => void onSplit(task, 1)}>
                        <Text style={[styles.splitAction, { color: colors.muted }]}>{t('tasks.unsplit')}</Text>
                      </Pressable>
                    </View>
                  ) : pickingId === task.id ? (
                    <View style={styles.splitRow}>
                      <Text style={[styles.splitAction, { color: colors.muted }]}>{t('tasks.splitHint')}</Text>
                      {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                        <Pressable
                          key={count}
                          disabled={busyId === task.id}
                          onPress={() => void onSplit(task, count)}
                          style={[styles.splitChip, { backgroundColor: `${colors.brand}22` }]}
                        >
                          <Text style={[styles.splitChipText, { color: colors.ink }]}>{count}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Pressable
                      disabled={busyId === task.id}
                      onPress={() => setPickingId(task.id)}
                      style={[styles.splitBtn, { borderColor: colors.line }]}
                    >
                      <AppIcon name="git-branch-outline" color={colors.brand} size={16} />
                      <Text style={[styles.splitBtnText, { color: colors.brand }]}>{t('tasks.split')}</Text>
                    </Pressable>
                  )}
                </TaskCardShell>
              );
            })
          )}

          <View style={[styles.form, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.formTitle, { color: colors.ink }]}>
              {editingId ? t('tasks.edit') : t('tasks.add')}
            </Text>
            {editingId ? null : (
              <View style={styles.formActions}>
                <View style={styles.formAction}>
                  <AppButton
                    variant="secondary"
                    label={t('tasks.import')}
                    onPress={() => {
                      setImportError(null);
                      setImportOpen(true);
                    }}
                  />
                </View>
                <View style={styles.formAction}>
                  <AppButton
                    variant="secondary"
                    label={t('tasks.copy')}
                    disabled={dayTasks.length === 0}
                    onPress={() => {
                      setCopyError(null);
                      setCopyOpen(true);
                    }}
                  />
                </View>
              </View>
            )}
            <Text style={[styles.label, { color: colors.muted }]}>{t('tasks.fields.title')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={t('tasks.fields.titlePlaceholder')}
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.label, { color: colors.muted }]}>{t('tasks.fields.minutes')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={minutes}
              onChangeText={setMinutes}
            />
            {formError ? <Text style={[styles.error, { color: colors.danger }]}>{formError}</Text> : null}
            <AppButton
              label={editingId ? t('common.save') : t('tasks.save')}
              loading={createTask.isPending || updateTask.isPending}
              onPress={() => void onSave()}
            />
            {editingId ? (
              <AppButton variant="ghost" label={t('common.cancel')} onPress={resetForm} />
            ) : null}
          </View>
        </SectionScrollView>
      </KeyboardAvoidingView>

      <TaskImportModal
        visible={importOpen}
        date={selectedDate}
        loading={bulkCreate.isPending}
        error={importError}
        onClose={() => setImportOpen(false)}
        onImport={(tasks) => void onImport(tasks)}
      />
      <TaskCopyModal
        visible={copyOpen}
        from={selectedDate}
        taskCount={dayTasks.length}
        year={year}
        month={month}
        loading={copyTasks.isPending}
        error={copyError}
        onClose={() => setCopyOpen(false)}
        onCopy={(dates) => void onCopy(dates)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formActions: { flexDirection: 'row', gap: 8 },
  formAction: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontFamily: fonts.display },
  subtitle: { fontFamily: fonts.regular, fontSize: 14 },
  planLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planLinkText: { fontSize: 14, fontFamily: fonts.bold },
  dayTitle: { fontSize: 18, fontFamily: fonts.bold, marginTop: 8 },
  empty: { fontFamily: fonts.regular, fontSize: 14 },
  error: { fontFamily: fonts.regular, fontSize: 14 },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    paddingBottom: 10,
    paddingRight: 4,
  },
  taskRow: {
    gap: 8,
  },
  taskMain: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    padding: 10,
    paddingBottom: 4,
  },
  taskCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    paddingTop: 2,
  },
  taskActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  importantBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  importantLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  splitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 10,
  },
  splitChip: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },
  splitChipText: { fontSize: 13, fontFamily: fonts.bold },
  splitLabel: { fontSize: 13, fontFamily: fonts.bold },
  splitAction: { fontSize: 12, fontFamily: fonts.semibold },
  splitBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  splitBtnText: { fontSize: 13, fontFamily: fonts.bold },
  check: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    flexShrink: 0,
  },
  checkMark: { fontFamily: fonts.bold },
  taskTitle: { fontSize: 15, fontFamily: fonts.semibold },
  minutes: { fontFamily: fonts.regular, fontSize: 13 },
  form: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 14,
  },
  formTitle: { fontSize: 16, fontFamily: fonts.bold },
  label: { fontSize: 13, fontFamily: fonts.semibold },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
