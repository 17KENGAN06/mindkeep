import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import { monthCells, weekdayLabels } from '../utils/date';

/** Same rule as the site: only days from the account start up to today can be ticked. */
export function canTrackSteps(date: string, startedOn: string, today: string): boolean {
  return date >= startedOn && date <= today;
}

type StepsCheckProps = {
  done: boolean;
  goal: number;
  disabled?: boolean;
  label: string;
  hint: string;
  onChange: (done: boolean) => void;
};

/** "Goal done" toggle for the selected day (site: features/nutrition/StepsCheck). */
export function StepsCheck({ done, goal, disabled = false, label, hint, onChange }: StepsCheckProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled }}
      disabled={disabled}
      onPress={() => onChange(!done)}
      style={[
        styles.check,
        {
          backgroundColor: done ? `${colors.brand}26` : colors.panel,
          borderColor: done ? `${colors.brand}80` : colors.line,
        },
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.checkIcon,
          {
            backgroundColor: done ? colors.brand : colors.panel,
            borderColor: done ? colors.brand : colors.line,
          },
        ]}
      >
        <AppIcon name={done ? 'checkmark' : 'footsteps-outline'} size={16} color={done ? colors.onBrand : colors.muted} />
      </View>
      <View style={styles.checkCopy}>
        <Text style={[styles.checkLabel, { color: colors.ink }]}>{label}</Text>
        <Text style={[styles.checkHint, { color: colors.muted }]}>
          {hint} · {goal.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

type StepsMonthGridProps = {
  year: number;
  month: number;
  today: string;
  startedOn: string;
  doneDates: ReadonlySet<string>;
  disabled?: boolean;
  onToggle: (date: string, done: boolean) => void;
};

/** Month of step days (site: features/nutrition/StepsMonthGrid). */
export function StepsMonthGrid({
  year,
  month,
  today,
  startedOn,
  doneDates,
  disabled = false,
  onToggle,
}: StepsMonthGridProps) {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const labels = weekdayLabels(language);
  const cells = monthCells(year, month);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekday, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.cells}>
        {cells.map((cell) => {
          if (!cell.inMonth) return <View key={`pad-${cell.date}`} style={styles.cell} />;

          const done = doneDates.has(cell.date);
          const isToday = cell.date === today;
          const trackable = canTrackSteps(cell.date, startedOn, today);
          const beforeStart = cell.date < startedOn;
          const boxStyle = done
            ? { backgroundColor: colors.brand, borderColor: colors.brand }
            : isToday && trackable
              ? { backgroundColor: `${colors.brand}1f`, borderColor: colors.brand }
              : trackable
                ? { backgroundColor: colors.panel, borderColor: colors.line }
                : beforeStart
                  ? { backgroundColor: `${colors.line}33`, borderColor: 'transparent' }
                  : { backgroundColor: 'transparent', borderColor: `${colors.line}59` };
          const textColor = done ? colors.onBrand : trackable ? colors.ink : colors.muted;

          return (
            <View key={cell.date} style={styles.cell}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done, disabled: !trackable || disabled }}
                accessibilityLabel={String(cell.day)}
                disabled={!trackable || disabled}
                onPress={() => onToggle(cell.date, !done)}
                style={[styles.day, boxStyle]}
              >
                <Text style={[styles.dayText, { color: textColor, opacity: trackable ? 1 : 0.6 }]}>
                  {cell.day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.5 },
  checkIcon: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkCopy: { flex: 1, minWidth: 0 },
  checkLabel: { fontSize: 14, fontWeight: '600' },
  checkHint: { fontSize: 12, marginTop: 2 },
  grid: { gap: 6 },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { aspectRatio: 1, maxHeight: 40, padding: 2, width: `${100 / 7}%` },
  day: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  dayText: { fontSize: 12, fontWeight: '700' },
});
