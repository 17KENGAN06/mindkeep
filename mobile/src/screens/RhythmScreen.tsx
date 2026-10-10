import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SectionScrollView } from '../components/SectionScrollView';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../components/AppIcon';
import { InlineQueryError } from '../components/QueryState';
import { AppButton, Badge } from '../components/ui';
import { mapAuthError } from '../features/auth/mapAuthError';
import {
  useCreateHabit,
  useDeleteHabit,
  usePrefetchRhythmNeighbors,
  useRhythmPeriod,
  useSetHabitCheck,
} from '../features/rhythm/useRhythm';
import type { RhythmHabit } from '../types/rhythm';
import { usePullToRefresh } from '../features/sync/usePullToRefresh';
import { useRefreshOnFocus } from '../features/sync/useRefreshOnFocus';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import { useAccountToday } from '../features/time/useAccountToday';
import { formatMonthTitle, monthCells, weekdayLabels } from '../utils/date';
import { fonts } from '../config/fonts';

function habitsForMonth(habits: RhythmHabit[], year: number, month: number, ready: boolean): RhythmHabit[] {
  if (ready) return habits;
  const target = new Date(year, month, 0).getDate();
  return habits.map((habit) => ({ ...habit, checks: [], done: 0, target }));
}

function HabitMonthCard({
  habit,
  year,
  month,
  today,
  cycleDays,
  language,
  busy,
  colors,
  onToggle,
  onDelete,
}: {
  habit: RhythmHabit;
  year: number;
  month: number;
  today: string;
  cycleDays: number;
  language: AppLanguage;
  busy: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onToggle: (date: string, done: boolean) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const checkSet = new Set(habit.checks);
  const cells = monthCells(year, month);
  const labels = weekdayLabels(language);
  const percent = Math.round((habit.done / Math.max(habit.target, 1)) * 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <View style={styles.habitHead}>
        <View style={styles.habitCopy}>
          <Text style={[styles.habitTitle, { color: colors.ink }]} numberOfLines={2}>
            {habit.title}
          </Text>
          <Text style={[styles.muted, { color: colors.muted }]}>
            {t('rhythm.streak', { count: habit.streak })} · {habit.lifetime}/{cycleDays}
          </Text>
        </View>
        {habit.formed ? <Badge tone="brand" label={t('rhythm.formed')} /> : null}
        <Pressable onPress={onDelete} hitSlop={8}>
          <AppIcon name="trash-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.weekLabels}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekLabel, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <View key={cell.date} style={styles.cell} />;
          }
          const done = checkSet.has(cell.date);
          const future = cell.date > today;
          const isToday = cell.date === today;
          return (
            <Pressable
              key={cell.date}
              disabled={future || busy}
              onPress={() => onToggle(cell.date, done)}
              style={[
                styles.cell,
                styles.cellHit,
                {
                  backgroundColor: done ? colors.brand : future ? colors.line : `${colors.brand}22`,
                  borderColor: isToday ? colors.brand : 'transparent',
                },
              ]}
            >
              <Text style={[styles.cellDay, { color: done ? colors.onBrand : isToday ? colors.brand : colors.ink }]}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.muted, { color: colors.muted }]}>
        {habit.done}/{habit.target} · {percent}%
      </Text>
    </View>
  );
}

export function RhythmScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('rhythm');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { today, year: todayYear, month: todayMonth } = useAccountToday();
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const periodQuery = useRhythmPeriod(year, month);
  usePrefetchRhythmNeighbors(year, month);
  const pull = usePullToRefresh(periodQuery);
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const setCheck = useSetHabitCheck();

  const periodReady = periodQuery.data?.year === year && periodQuery.data?.month === month;
  const habits = habitsForMonth(periodQuery.data?.habits ?? [], year, month, periodReady);
  const cycleDays = periodQuery.data?.cycleDays ?? 30;

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
    } catch (caught) {
      setError(mapAuthError(caught, t));
    }
  };

  return (
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
    >
      <Text style={[styles.lead, { color: colors.muted }]}>{t('rhythm.subtitle', { days: cycleDays })}</Text>

      <View style={styles.monthRow}>
        <Pressable onPress={() => shiftMonth(-1)} style={[styles.monthBtn, { borderColor: colors.line }]}>
          <AppIcon name="chevron-back" color={colors.ink} size={18} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.ink }]} numberOfLines={1}>
          {formatMonthTitle(year, month, language)}
        </Text>
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

      {periodQuery.isError && periodQuery.data ? <InlineQueryError error={periodQuery.error} /> : null}

      {periodQuery.isPending && !periodQuery.data ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{t('common.loading')}</Text>
      ) : !periodQuery.data ? (
        // Load failed with nothing cached: say so instead of "no habits".
        <View style={styles.retry}>
          <InlineQueryError error={periodQuery.error} />
          <AppButton
            label={t('common.retry')}
            variant="secondary"
            loading={periodQuery.isFetching}
            onPress={() => void periodQuery.refetch()}
          />
        </View>
      ) : habits.length === 0 ? (
        <Text style={[styles.muted, { color: colors.muted }]}>{t('rhythm.empty')}</Text>
      ) : (
        <View style={[styles.cards, !periodReady && styles.cardsPending]}>
          {habits.map((habit) => (
            <HabitMonthCard
              key={habit.id}
              habit={habit}
              year={year}
              month={month}
              today={today}
              cycleDays={cycleDays}
              language={language}
              busy={setCheck.isPending || !periodReady}
              colors={colors}
              onToggle={(date, done) => void setCheck.mutateAsync({ habitId: habit.id, date, done: !done })}
              onDelete={() => void deleteHabit.mutateAsync(habit.id)}
            />
          ))}
        </View>
      )}
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  lead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  monthRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  monthBtn: { borderRadius: 12, borderWidth: 1, padding: 8 },
  monthTitle: { flex: 1, fontSize: 16, fontFamily: fonts.bold, textAlign: 'center', textTransform: 'capitalize' },
  input: { borderRadius: 14, borderWidth: 1, fontFamily: fonts.regular, fontSize: 16, paddingHorizontal: 12, paddingVertical: 12 },
  error: { fontFamily: fonts.regular, fontSize: 13 },
  muted: { fontFamily: fonts.regular, fontSize: 13 },
  retry: { gap: 8 },
  cards: { gap: 12 },
  cardsPending: { opacity: 0.6 },
  card: { borderRadius: 20, borderWidth: 1, gap: 10, padding: 14 },
  habitHead: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  habitCopy: { flex: 1, minWidth: 0 },
  habitTitle: { fontSize: 16, fontFamily: fonts.bold },
  weekLabels: { flexDirection: 'row' },
  weekLabel: { flex: 1, fontSize: 11, fontFamily: fonts.semibold, textAlign: 'center', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: '14.285%',
  },
  cellHit: {
    borderRadius: 10,
    borderWidth: 2,
  },
  cellDay: { fontSize: 12, fontFamily: fonts.semibold },
});
