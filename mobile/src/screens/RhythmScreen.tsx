import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../components/AppIcon';
import { AppButton, Badge } from '../components/ui';
import { useCreateHabit, useDeleteHabit, useRhythmPeriod, useSetHabitCheck } from '../features/rhythm/useRhythm';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import { formatMonthTitle } from '../utils/date';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function RhythmScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const periodQuery = useRhythmPeriod(year, month);
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const setCheck = useSetHabitCheck();

  const today = periodQuery.data?.today ?? dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const daysInMonth = periodQuery.data?.daysInMonth ?? new Date(year, month, 0).getDate();
  const habits = periodQuery.data?.habits ?? [];
  const cycleDays = periodQuery.data?.cycleDays ?? 30;

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = dateKey(year, month, day);
        const weekday = new Intl.DateTimeFormat(language, { weekday: 'narrow' }).format(
          new Date(year, month - 1, day),
        );
        return { day, date, weekday };
      }),
    [daysInMonth, language, month, year],
  );

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const onAdd = async () => {
    const next = title.trim();
    if (!next) {
      setError(t('rhythm.errors.title'));
      return;
    }
    setError(null);
    try {
      await createHabit.mutateAsync(next);
      setTitle('');
    } catch {
      setError(t('auth.errors.generic'));
    }
  };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('rhythm.subtitle', { days: cycleDays })}</Text>

      <View style={styles.monthRow}>
        <Pressable onPress={() => shiftMonth(-1)} style={[styles.monthBtn, { borderColor: colors.line }]}>
          <AppIcon name="chevron-back" color={colors.ink} size={18} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
        <Pressable onPress={() => shiftMonth(1)} style={[styles.monthBtn, { borderColor: colors.line }]}>
          <AppIcon name="chevron-forward" color={colors.ink} size={18} />
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('rhythm.addPlaceholder')}
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink }]}
      />
      <AppButton label={t('rhythm.add')} loading={createHabit.isPending} onPress={() => void onAdd()} />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      {periodQuery.isLoading ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{t('common.loading')}</Text>
      ) : habits.length === 0 ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{t('rhythm.empty')}</Text>
      ) : (
        habits.map((habit) => {
          const checkSet = new Set(habit.checks);
          return (
            <View key={habit.id} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
              <View style={styles.habitHead}>
                <View style={styles.habitCopy}>
                  <Text style={[styles.habitTitle, { color: colors.ink }]}>{habit.title}</Text>
                  <Text style={[styles.muted, { color: colors.muted }]}>
                    {t('rhythm.streak', { count: habit.streak })} · {habit.lifetime}/{cycleDays}
                  </Text>
                </View>
                {habit.formed ? <Badge tone="brand" label={t('rhythm.formed')} /> : null}
                <Pressable onPress={() => void deleteHabit.mutateAsync(habit.id)} hitSlop={8}>
                  <AppIcon name="trash-outline" color={colors.muted} size={18} />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
                {days.map((item) => {
                  const done = checkSet.has(item.date);
                  const future = item.date > today;
                  return (
                    <Pressable
                      key={item.date}
                      disabled={future || setCheck.isPending}
                      onPress={() => void setCheck.mutateAsync({ habitId: habit.id, date: item.date, done: !done })}
                      style={styles.cellWrap}
                    >
                      <Text style={[styles.cellDay, { color: item.date === today ? colors.brand : colors.muted }]}>
                        {item.day}
                      </Text>
                      <View
                        style={[
                          styles.cell,
                          {
                            backgroundColor: done ? colors.brand : future ? colors.line : `${colors.brand}22`,
                            borderColor: item.date === today ? colors.brand : 'transparent',
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={[styles.muted, { color: colors.muted }]}>
                {habit.done}/{habit.target} · {Math.round((habit.done / Math.max(habit.target, 1)) * 100)}%
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  lead: { fontSize: 14, lineHeight: 20 },
  monthRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  monthBtn: { borderRadius: 12, borderWidth: 1, padding: 8 },
  monthTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 12 },
  error: { fontSize: 13 },
  muted: { fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, gap: 10, padding: 14 },
  habitHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  habitCopy: { flex: 1, minWidth: 0 },
  habitTitle: { fontSize: 16, fontWeight: '700' },
  grid: { gap: 6, paddingVertical: 2 },
  cellWrap: { alignItems: 'center', width: 28 },
  cellDay: { fontSize: 10, marginBottom: 4 },
  cell: { borderRadius: 8, borderWidth: 2, height: 24, width: 24 },
});
