import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MonthGrid } from '../../components/MonthGrid';
import { InlineQueryError, QueryErrorView } from '../../components/QueryState';
import { AppButton, Badge } from '../../components/ui';
import { useReminderCalendar } from '../../features/reminders/useCalendar';
import { usePullToRefresh } from '../../features/sync/usePullToRefresh';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { ReviewStackParamList } from '../../navigation/types';
import { useAccountToday, useTodayRollover } from '../../features/time/useAccountToday';
import { formatDate } from '../../utils/date';
import { fonts } from '../../config/fonts';

function statusTone(status: string) {
  if (status === 'OVERDUE') return 'danger' as const;
  if (status === 'COMPLETED') return 'brand' as const;
  if (status === 'SKIPPED') return 'neutral' as const;
  return 'warn' as const;
}

export function ReviewCalendarScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('reminders');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<ReviewStackParamList>>();
  const { today, year: todayYear, month: todayMonth } = useAccountToday();
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  // At midnight, move along only if the user was still looking at the old "today".
  useTodayRollover(today, (previous, next) => {
    if (selectedDate !== previous) return;
    setSelectedDate(next);
    setYear(Number(next.slice(0, 4)));
    setMonth(Number(next.slice(5, 7)));
  });
  const calendarQuery = useReminderCalendar(year, month);
  const pull = usePullToRefresh(calendarQuery);

  const selectedReminders = useMemo(() => {
    if (!calendarQuery.data || !selectedDate) return [];
    return calendarQuery.data.reminders.filter((reminder) => reminder.localDate === selectedDate);
  }, [calendarQuery.data, selectedDate]);

  const selectedSummary = calendarQuery.data?.days.find((day) => day.date === selectedDate);

  if (calendarQuery.isLoading && !calendarQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!calendarQuery.data) {
    return (
      <QueryErrorView
        error={calendarQuery.error}
        onRetry={() => void calendarQuery.refetch()}
        retrying={calendarQuery.isFetching}
      />
    );
  }

  return (
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
    >
      {calendarQuery.isError ? <InlineQueryError error={calendarQuery.error} /> : null}
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('calendar.subtitle')}</Text>
      <Text style={[styles.timezone, { color: colors.muted }]}>{calendarQuery.data.timezone}</Text>

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

      <Text style={[styles.dayTitle, { color: colors.ink }]}>
        {selectedDate ? t('calendar.dayTitle', { date: formatDate(selectedDate, language) }) : t('calendar.pickDay')}
      </Text>
      {selectedSummary ? (
        <Text style={[styles.counts, { color: colors.muted }]}>
          {t('calendar.dayCounts', {
            total: selectedSummary.total,
            overdue: selectedSummary.overdue,
            pending: selectedSummary.pending,
            completed: selectedSummary.completed,
          })}
        </Text>
      ) : null}

      {selectedReminders.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('calendar.emptyDayDescription')}</Text>
      ) : (
        selectedReminders.map((reminder) => (
          <View
            key={reminder.id}
            style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <View style={styles.cardHead}>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{reminder.material.title}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
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
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14 },
  timezone: { fontFamily: fonts.regular, fontSize: 12 },
  dayTitle: { fontSize: 18, fontFamily: fonts.bold, marginTop: 8 },
  counts: { fontFamily: fonts.regular, fontSize: 13 },
  empty: { fontFamily: fonts.regular, fontSize: 14, marginTop: 8 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold },
  meta: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
