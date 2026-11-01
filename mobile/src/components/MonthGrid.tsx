import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { CalendarDaySummary } from '../types/calendar';
import { useAccountToday } from '../features/time/useAccountToday';
import { dateKey, formatMonthTitle, monthGrid, weekdayLabels } from '../utils/date';
import { fonts } from '../config/fonts';

type MonthGridProps = {
  year: number;
  month: number;
  selectedDate: string | null;
  days: CalendarDaySummary[];
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: string) => void;
  /** Starts as one week; the month opens from the title, so the screen's content stays on top. */
  compact?: boolean;
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
  compact = false,
}: MonthGridProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { today } = useAccountToday();
  const labels = weekdayLabels(language);
  const [expanded, setExpanded] = useState(false);
  const weekOnly = compact && !expanded;
  // The week on show: follows the picked day, and the arrows move it on their own.
  const [anchor, setAnchor] = useState(selectedDate ?? today);
  const [anchorFor, setAnchorFor] = useState(selectedDate);
  if (selectedDate !== anchorFor) {
    setAnchorFor(selectedDate);
    if (selectedDate) setAnchor(selectedDate);
  }
  const anchorYear = Number(anchor.slice(0, 4));
  const anchorMonth = Number(anchor.slice(5, 7));
  const anchorGrid = monthGrid(anchorYear, anchorMonth);
  const anchorRow = Math.floor(anchorGrid.findIndex((date) => dateKey(date) === anchor) / 7);
  const grid = weekOnly
    ? anchorGrid.slice(anchorRow * 7, anchorRow * 7 + 7)
    : monthGrid(year, month);
  const moveWeek = (weeks: number) => {
    const next = new Date(anchorYear, anchorMonth - 1, Number(anchor.slice(8, 10)) + weeks * 7);
    setAnchor(dateKey(next));
    if (next.getFullYear() !== year || next.getMonth() + 1 !== month) {
      onMonthChange(next.getFullYear(), next.getMonth() + 1);
    }
  };
  const summaryByDate = new Map(days.map((day) => [day.date, day]));
  const showImportantLegend = days.some((day) => (day.important ?? 0) > 0);
  const statusColor: Record<Exclude<DayStatus, 'none'>, string> = {
    overdue: colors.danger,
    pending: colors.warn,
    completed: colors.brand,
  };

  const prev = () => {
    if (weekOnly) {
      moveWeek(-1);
      return;
    }
    const date = new Date(year, month - 2, 1);
    onMonthChange(date.getFullYear(), date.getMonth() + 1);
  };
  const next = () => {
    if (weekOnly) {
      moveWeek(1);
      return;
    }
    const date = new Date(year, month, 1);
    onMonthChange(date.getFullYear(), date.getMonth() + 1);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <View style={styles.nav}>
        <Pressable onPress={prev} style={styles.navBtn} accessibilityLabel={t('calendar.prevMonth')}>
          <Text style={[styles.navText, { color: colors.brand }]}>‹</Text>
        </Pressable>
        {compact ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? t('calendar.showWeek') : t('calendar.showMonth')}
            onPress={() => setExpanded((value) => !value)}
            style={styles.titleButton}
          >
            <Text style={[styles.title, { color: colors.ink }]}>
              {formatMonthTitle(weekOnly ? anchorYear : year, weekOnly ? anchorMonth : month, language)}
            </Text>
            <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
          </Pressable>
        ) : (
          <Text style={[styles.title, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
        )}
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
          const inMonth = weekOnly || date.getMonth() === month - 1;
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
              {status !== 'none' || (summary?.important ?? 0) > 0 ? (
                <View style={styles.dots}>
                  {status !== 'none' ? (
                    <View style={[styles.dot, { backgroundColor: statusColor[status] }]} />
                  ) : null}
                  {(summary?.important ?? 0) > 0 ? (
                    <View style={[styles.dot, { backgroundColor: colors.warn }]} />
                  ) : null}
                </View>
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>

      {weekOnly ? null : (
      <View style={styles.legend}>
        <LegendDot color={colors.danger} label={t('calendar.legend.overdue')} />
        <LegendDot color={colors.warn} label={t('calendar.legend.pending')} />
        <LegendDot color={colors.brand} label={t('calendar.legend.completed')} />
        {showImportantLegend ? (
          <LegendDot color={colors.warn} label={t('calendar.legend.important')} />
        ) : null}
      </View>
      )}
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  nav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { height: 40, justifyContent: 'center', width: 40 },
  navText: { fontFamily: fonts.regular, fontSize: 28, textAlign: 'center' },
  title: { fontSize: 16, fontFamily: fonts.bold, textTransform: 'capitalize' },
  titleButton: { alignItems: 'center', flexDirection: 'row', gap: 6, minHeight: 40 },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: 11, fontFamily: fonts.semibold, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: '14.285%',
  },
  cellOutside: { opacity: 0.4 },
  day: { fontSize: 14, fontFamily: fonts.semibold },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 4 },
  dot: { borderRadius: 3, height: 6, width: 6 },
  dotSpacer: { height: 10 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, paddingHorizontal: 4 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendText: { fontFamily: fonts.regular, fontSize: 12 },
});
