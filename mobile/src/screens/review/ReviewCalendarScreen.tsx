import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MonthGrid } from '../../components/MonthGrid';
import { AppButton, Badge } from '../../components/ui';
import { useReminderCalendar } from '../../features/reminders/useCalendar';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { formatDate, todayDateKey } from '../../utils/date';

function statusTone(status: string) {
  if (status === 'OVERDUE') return 'danger' as const;
  if (status === 'COMPLETED') return 'brand' as const;
  if (status === 'SKIPPED') return 'neutral' as const;
  return 'warn' as const;
}

export function ReviewCalendarScreen() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const today = todayDateKey();
  const initial = new Date();
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const calendarQuery = useReminderCalendar(year, month);

  const selectedReminders = useMemo(() => {
    if (!calendarQuery.data || !selectedDate) return [];
    return calendarQuery.data.reminders.filter((reminder) => reminder.localDate === selectedDate);
  }, [calendarQuery.data, selectedDate]);

  const selectedSummary = calendarQuery.data?.days.find((day) => day.date === selectedDate);

  if (calendarQuery.isLoading && !calendarQuery.data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (calendarQuery.isError || !calendarQuery.data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t('auth.errors.generic')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t('calendar.subtitle')}</Text>
      <Text style={styles.timezone}>{calendarQuery.data.timezone}</Text>

      <MonthGrid
        year={year}
        month={month}
        selectedDate={selectedDate}
        days={calendarQuery.data.days}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        onSelectDate={setSelectedDate}
      />

      <Text style={styles.dayTitle}>
        {selectedDate ? t('calendar.dayTitle', { date: formatDate(selectedDate, language) }) : t('calendar.pickDay')}
      </Text>
      {selectedSummary ? (
        <Text style={styles.counts}>
          {t('calendar.dayCounts', {
            total: selectedSummary.total,
            overdue: selectedSummary.overdue,
            pending: selectedSummary.pending,
            completed: selectedSummary.completed,
          })}
        </Text>
      ) : null}

      {selectedReminders.length === 0 ? (
        <Text style={styles.empty}>{t('calendar.emptyDayDescription')}</Text>
      ) : (
        selectedReminders.map((reminder) => (
          <View key={reminder.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{reminder.material.title}</Text>
                <Text style={styles.meta}>
                  {reminder.material.category?.name ?? t('materials.fields.noCategory')} · #
                  {reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
                </Text>
              </View>
              <Badge tone={statusTone(reminder.status)} label={t(`materials.reminderStatus.${reminder.status}`)} />
            </View>
            <View style={styles.actions}>
              <AppButton
                variant="secondary"
                label={t('review.openMaterial')}
                onPress={() => navigation.navigate('MaterialDetail', { id: reminder.material.id })}
              />
              {(reminder.status === 'PENDING' || reminder.status === 'OVERDUE') && (
                <AppButton label={t('tabs.review')} onPress={() => navigation.navigate('ReviewInbox')} />
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', backgroundColor: colors.bg, flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14 },
  timezone: { color: colors.muted, fontSize: 12 },
  dayTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 8 },
  counts: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, fontSize: 14, marginTop: 8 },
  error: { color: colors.danger },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardText: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
