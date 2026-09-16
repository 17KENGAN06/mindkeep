import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { CalendarDaySummary } from '../types/calendar';
import { dateKey, formatMonthTitle, monthGrid, todayDateKey, weekdayLabels } from '../utils/date';

type MonthGridProps = {
  year: number;
  month: number;
  selectedDate: string | null;
  days: CalendarDaySummary[];
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: string) => void;
};

type DayStatus = 'overdue' | 'pending' | 'completed' | 'none';

function dayStatus(summary?: CalendarDaySummary): DayStatus {
  if (!summary || summary.total === 0) return 'none';
  if (summary.overdue > 0) return 'overdue';
  if (summary.pending > 0) return 'pending';
  if (summary.completed > 0) return 'completed';
  return 'none';
}

export function MonthGrid({
  year,
  month,
  selectedDate,
  days,
  onMonthChange,
  onSelectDate,
}: MonthGridProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const today = todayDateKey();
  const labels = weekdayLabels(language);
  const grid = monthGrid(year, month);
  const summaryByDate = new Map(days.map((day) => [day.date, day]));
  const statusColor: Record<Exclude<DayStatus, 'none'>, string> = {
    overdue: colors.danger,
    pending: colors.warn,
    completed: colors.brand,
  };

  const prev = () => {
    const date = new Date(year, month - 2, 1);
    onMonthChange(date.getFullYear(), date.getMonth() + 1);
  };
  const next = () => {
    const date = new Date(year, month, 1);
    onMonthChange(date.getFullYear(), date.getMonth() + 1);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <View style={styles.nav}>
        <Pressable onPress={prev} style={styles.navBtn} accessibilityLabel={t('calendar.prevMonth')}>
          <Text style={[styles.navText, { color: colors.brand }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
        <Pressable onPress={next} style={styles.navBtn} accessibilityLabel={t('calendar.nextMonth')}>
          <Text style={[styles.navText, { color: colors.brand }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekday, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((date) => {
          const key = dateKey(date);
          const inMonth = date.getMonth() === month - 1;
          const summary = summaryByDate.get(key);
          const status = dayStatus(summary);
          const selected = key === selectedDate;
          const isToday = key === today;
          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(key)}
              style={[
                styles.cell,
                selected && { backgroundColor: `${colors.brand}2E`, borderRadius: 12 },
                isToday && !selected && { borderColor: colors.brand, borderRadius: 12, borderWidth: 1 },
                !inMonth && styles.cellOutside,
              ]}
            >
              <Text
                style={[
                  styles.day,
                  { color: colors.ink },
                  !inMonth && { color: colors.muted },
                  selected && { color: colors.brand },
                ]}
              >
                {date.getDate()}
              </Text>
              {status !== 'none' ? (
                <View style={[styles.dot, { backgroundColor: statusColor[status] }]} />
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendDot color={colors.danger} label={t('calendar.legend.overdue')} />
        <LegendDot color={colors.warn} label={t('calendar.legend.pending')} />
        <LegendDot color={colors.brand} label={t('calendar.legend.completed')} />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
  },
  nav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { height: 40, justifyContent: 'center', width: 40 },
  navText: { fontSize: 28, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: '14.285%',
  },
  cellOutside: { opacity: 0.4 },
  day: { fontSize: 14, fontWeight: '600' },
  dot: { borderRadius: 3, height: 6, marginTop: 4, width: 6 },
  dotSpacer: { height: 10 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, paddingHorizontal: 4 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendText: { fontSize: 12 },
});
