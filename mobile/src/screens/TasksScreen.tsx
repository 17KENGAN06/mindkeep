import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { AppIcon } from '../components/AppIcon';
import { AppButton } from '../components/ui';
import { ForestCard } from '../components/forest/ForestCard';
import {
  useCreateTask,
  useDeleteTask,
  useForestSummary,
  useTasksPeriod,
  useToggleTask,
  useUpdateTask,
} from '../features/tasks/useDailyTasks';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { TasksStackParamList } from '../navigation/types';
import type { CalendarDaySummary } from '../types/calendar';
import type { DailyTask } from '../types/dailyTask';
import { formatDate, formatMonthTitle, todayDateKey } from '../utils/date';

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split('-').map(Number);
  return y === year && m === month;
}

export function TasksScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const today = todayDateKey();
  const initial = new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const periodQuery = useTasksPeriod(year, month);
  const toggleTask = useToggleTask(selectedDate);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(selectedDate);
  const deleteTask = useDeleteTask();
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
      })),
    [periodQuery.data?.days],
  );

  const dayTasks = (periodQuery.data?.tasks ?? []).filter((task) => task.date === selectedDate);

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
    } catch {
      setFormError(t('auth.errors.generic'));
    }
  };

  const onToggle = async (task: DailyTask) => {
    setBusyId(task.id);
    setFormError(null);
    try {
      await toggleTask.mutateAsync({ id: task.id, completed: !task.completed });
    } catch {
      setFormError(t('auth.errors.generic'));
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
          void deleteTask
            .mutateAsync(task.id)
            .then(() => {
              if (editingId === task.id) resetForm();
            })
            .catch(() => setFormError(t('auth.errors.generic')))
            .finally(() => setBusyId(null));
        },
      },
    ]);
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

          <Text style={[styles.dayTitle, { color: colors.ink }]}>
            {t('tasks.dayTitle', { date: formatDate(selectedDate, language) })}
          </Text>

          {dayTasks.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('tasks.empty')}</Text>
          ) : (
            dayTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskRow,
                  { backgroundColor: colors.panel, borderColor: colors.line },
                  task.completed && { borderColor: `${colors.brand}59` },
                  editingId === task.id && { borderColor: colors.brand },
                ]}
              >
                <Pressable
                  disabled={busyId === task.id}
                  onPress={() => void onToggle(task)}
                  style={styles.taskMain}
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
            ))
          )}

          <View style={[styles.form, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.formTitle, { color: colors.ink }]}>
              {editingId ? t('tasks.edit') : t('tasks.add')}
            </Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14 },
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
  planLinkText: { fontSize: 14, fontWeight: '700' },
  dayTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  empty: { fontSize: 14 },
  error: { fontSize: 14 },
  taskRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingRight: 4,
  },
  taskMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
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
  form: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 14,
  },
  formTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
