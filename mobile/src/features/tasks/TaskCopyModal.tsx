import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../../components/AppIcon';
import { SheetModal } from '../../components/SheetModal';
import { AppButton } from '../../components/ui';
import type { AppLanguage } from '../../i18n';
import { formatMonthTitle, monthCells, weekdayLabels } from '../../utils/date';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../../config/fonts';

const MAX_DAYS = 21;

type TaskCopyModalProps = {
  visible: boolean;
  from: string;
  taskCount: number;
  year: number;
  month: number;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onCopy: (dates: string[]) => void;
};

/** Copy one day's plan to up to 21 other days (site: features/tasks/TaskCopyDialog). */
export function TaskCopyModal({
  visible,
  from,
  taskCount,
  year: initialYear,
  month: initialMonth,
  loading = false,
  error,
  onClose,
  onCopy,
}: TaskCopyModalProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [picked, setPicked] = useState<string[]>([]);

  // Start fresh when the dialog opens or its start month changes while open (adjusted during render).
  const [resetFor, setResetFor] = useState({ visible, initialYear, initialMonth });
  if (
    resetFor.visible !== visible ||
    resetFor.initialYear !== initialYear ||
    resetFor.initialMonth !== initialMonth
  ) {
    setResetFor({ visible, initialYear, initialMonth });
    if (visible) {
      setYear(initialYear);
      setMonth(initialMonth);
      setPicked([]);
    }
  }

  const labels = weekdayLabels(language);
  const cells = monthCells(year, month);
  const pickedSet = new Set(picked);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const toggle = (date: string) => {
    if (date === from) return;
    setPicked((current) => {
      if (current.includes(date)) return current.filter((item) => item !== date);
      if (current.length >= MAX_DAYS) return current;
      return [...current, date].sort();
    });
  };

  return (
    <SheetModal
      visible={visible}
      title={t('tasks.copyTitle')}
      subtitle={t('tasks.copyHint')}
      onClose={onClose}
      footer={
        <>
          <AppButton
            label={t('tasks.copySubmit', { count: picked.length })}
            loading={loading}
            disabled={picked.length === 0}
            onPress={() => {
              if (picked.length > 0) onCopy(picked);
            }}
          />
          <AppButton variant="secondary" label={t('common.cancel')} disabled={loading} onPress={onClose} />
        </>
      }
    >
      <Text style={[styles.from, { color: colors.ink }]}>{t('tasks.copyFrom', { date: from, count: taskCount })}</Text>

      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.copyPrevMonth')}
          onPress={() => shiftMonth(-1)}
          style={styles.navBtn}
        >
          <AppIcon name="chevron-back" color={colors.muted} size={20} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.copyNextMonth')}
          onPress={() => shiftMonth(1)}
          style={styles.navBtn}
        >
          <AppIcon name="chevron-forward" color={colors.muted} size={20} />
        </Pressable>
      </View>

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
          const selected = pickedSet.has(cell.date);
          const source = cell.date === from;
          const boxStyle = selected
            ? { backgroundColor: colors.brand, borderColor: colors.brand }
            : source
              ? { backgroundColor: `${colors.brand}1f`, borderColor: colors.brand }
              : { backgroundColor: colors.panel, borderColor: colors.line };
          return (
            <View key={cell.date} style={styles.cell}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: source }}
                accessibilityLabel={String(cell.day)}
                disabled={source}
                onPress={() => toggle(cell.date)}
                style={[styles.day, boxStyle, source && styles.source]}
              >
                <Text style={[styles.dayText, { color: selected ? colors.onBrand : colors.ink }]}>{cell.day}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={[styles.muted, { color: colors.muted }]}>{t('tasks.copyPicked', { count: picked.length })}</Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  from: { fontSize: 14, fontFamily: fonts.semibold },
  muted: { fontFamily: fonts.regular, fontSize: 13 },
  error: { fontFamily: fonts.regular, fontSize: 14 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  navBtn: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  monthTitle: { fontSize: 15, fontFamily: fonts.bold },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    fontSize: 10,
    fontFamily: fonts.semibold,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { aspectRatio: 1, maxHeight: 44, padding: 2, width: `${100 / 7}%` },
  day: { alignItems: 'center', borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center' },
  source: { opacity: 0.4 },
  dayText: { fontSize: 13, fontFamily: fonts.bold },
});
