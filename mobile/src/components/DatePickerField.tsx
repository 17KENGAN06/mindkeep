import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';
import { MonthGrid } from './MonthGrid';
import { fonts } from '../config/fonts';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import { formatDate } from '../utils/date';

type DatePickerFieldProps = {
  /** YYYY-MM-DD */
  value: string;
  onChange: (date: string) => void;
  /** Calendar heading and spoken label; defaults to "Date". */
  title?: string;
};

/** A date field that opens a month calendar instead of asking to type YYYY-MM-DD. */
export function DatePickerField({ value, onChange, title }: DatePickerFieldProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const [open, setOpen] = useState(false);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const heading = title ?? t('finance.date');

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={heading}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.panel, borderColor: pressed ? colors.brand : colors.line },
        ]}
      >
        <AppIcon name="calendar-outline" color={colors.brand} size={17} />
        <Text style={[styles.value, { color: valid ? colors.ink : colors.muted }]} numberOfLines={1}>
          {valid ? formatDate(value, language) : '—'}
        </Text>
        <AppIcon name="chevron-down" color={colors.muted} size={16} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <SafeAreaProvider>
          <CalendarCard
            title={heading}
            value={valid ? value : null}
            onClose={() => setOpen(false)}
            onPick={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

type CalendarCardProps = {
  title: string;
  value: string | null;
  onClose: () => void;
  onPick: (date: string) => void;
};

function CalendarCard({ title, value, onClose, onPick }: CalendarCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const start = value ?? new Date().toISOString().slice(0, 10);
  const [year, setYear] = useState(Number(start.slice(0, 4)));
  const [month, setMonth] = useState(Number(start.slice(5, 7)));
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [appear]);

  return (
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.bg, borderColor: colors.line, shadowColor: colors.brand },
          { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
        ]}
      >
        <View style={styles.head}>
          <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            onPress={onClose}
            style={[styles.close, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <AppIcon name="close" color={colors.ink} size={18} />
          </Pressable>
        </View>
        <MonthGrid
          year={year}
          month={month}
          selectedDate={value}
          days={[]}
          onMonthChange={(nextYear, nextMonth) => {
            setYear(nextYear);
            setMonth(nextMonth);
          }}
          onSelectDate={onPick}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 15 },
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(3,8,6,0.7)', flex: 1, justifyContent: 'center', padding: 16 },
  card: {
    alignSelf: 'stretch',
    borderRadius: 26,
    borderWidth: 1,
    elevation: 20,
    gap: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
  },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.2 },
  close: { alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
});
