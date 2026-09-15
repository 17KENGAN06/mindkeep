import { useMemo, useState } from 'react';
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
import { AppButton } from '../components/ui';
import {
  useCreateTask,
  useDeleteTask,
  useTasksPeriod,
  useToggleTask,
} from '../features/tasks/useDailyTasks';
import type { AppLanguage } from '../i18n';
import { colors } from '../theme';
import type { CalendarDaySummary } from '../types/calendar';
import type { DailyTask } from '../types/dailyTask';
import { formatDate, todayDateKey } from '../utils/date';

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateInMonth(date: string, year: number, month: number): boolean {
  const [y, m] = date.split('-').map(Number);
  return y === year && m === month;
}

export function TasksScreen() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const today = todayDateKey();
  const initial = new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const periodQuery = useTasksPeriod(year, month);
  const toggleTask = useToggleTask(selectedDate);
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

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

  const onAdd = async () => {
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
      await createTask.mutateAsync({
        title: title.trim(),
        minutes: Math.round(mins),
        date: selectedDate,
      });
      setTitle('');
      setMinutes('30');
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
            .catch(() => setFormError(t('auth.errors.generic')))
            .finally(() => setBusyId(null));
        },
      },
    ]);
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
          <Text style={styles.title}>{t('tasks.title')}</Text>
          <Text style={styles.subtitle}>{t('tasks.subtitle')}</Text>

          {periodQuery.isError ? <Text style={styles.error}>{t('auth.errors.generic')}</Text> : null}

          <MonthGrid
            year={year}
            month={month}
            selectedDate={selectedDate}
            days={calendarDays}
            onMonthChange={onMonthChange}
            onSelectDate={setSelectedDate}
          />

          <Text style={styles.dayTitle}>
            {t('tasks.dayTitle', { date: formatDate(selectedDate, language) })}
          </Text>

          {dayTasks.length === 0 ? (
            <Text style={styles.empty}>{t('tasks.empty')}</Text>
          ) : (
            dayTasks.map((task) => (
              <View key={task.id} style={[styles.taskRow, task.completed && styles.taskDone]}>
                <Pressable
                  disabled={busyId === task.id}
                  onPress={() => void onToggle(task)}
                  style={styles.taskMain}
                >
                  <View style={[styles.check, task.completed && styles.checkOn]}>
                    {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text
                    style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  <Text style={styles.minutes}>
                    {task.minutes} {t('today.min')}
                  </Text>
                </Pressable>
                <AppButton
                  variant="ghost"
                  label={t('common.delete')}
                  disabled={busyId === task.id || deleteTask.isPending}
                  onPress={() => onDelete(task)}
                />
              </View>
            ))
          )}

          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('tasks.add')}</Text>
            <Text style={styles.label}>{t('tasks.fields.title')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('tasks.fields.titlePlaceholder')}
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>{t('tasks.fields.minutes')}</Text>
            <TextInput
              keyboardType="number-pad"
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
            />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <AppButton
              label={t('tasks.save')}
              loading={createTask.isPending}
              onPress={() => void onAdd()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.bg, flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14 },
  dayTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 8 },
  empty: { color: colors.muted, fontSize: 14 },
  error: { color: colors.danger, fontSize: 14 },
  taskRow: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingRight: 4,
  },
  taskDone: { borderColor: 'rgba(142, 239, 180, 0.35)' },
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
  form: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 14,
  },
  formTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
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
});
