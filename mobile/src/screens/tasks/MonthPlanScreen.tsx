import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTasksPeriod, useTasksYear } from '../../features/tasks/useDailyTasks';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import { formatMonthTitle } from '../../utils/date';

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

export function MonthPlanScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const now = useMemo(() => new Date(), []);
  const [view, setView] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const yearQuery = useTasksYear(year);
  const monthQuery = useTasksPeriod(year, month);
  const query = view === 'year' ? yearQuery : monthQuery;

  if (query.isLoading && !query.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const data = query.data;
  const totals = data?.totals ?? {
    total: (data?.days ?? []).reduce((sum, day) => sum + day.total, 0),
    completed: (data?.days ?? []).reduce((sum, day) => sum + day.completed, 0),
    pending: (data?.days ?? []).reduce((sum, day) => sum + day.pending, 0),
    overdue: (data?.days ?? []).reduce((sum, day) => sum + day.overdue, 0),
    minutes: 0,
    minutesDone: 0,
  };
  const completion = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
  const byMonth = data?.byMonth ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('tasks.planSubtitle')}</Text>
      {query.isError ? (
        <Text style={[styles.error, { color: colors.danger }]}>{t('auth.errors.generic')}</Text>
      ) : null}

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setView('year')}
          style={[
            styles.tab,
            { borderColor: colors.line },
            view === 'year' && { backgroundColor: colors.brand, borderColor: colors.brand },
          ]}
        >
          <Text
            style={[
              { color: colors.muted, fontSize: 13, fontWeight: '700' },
              view === 'year' && { color: colors.onBrand },
            ]}
          >
            {t('tasks.viewYear')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('month')}
          style={[
            styles.tab,
            { borderColor: colors.line },
            view === 'month' && { backgroundColor: colors.brand, borderColor: colors.brand },
          ]}
        >
          <Text
            style={[
              { color: colors.muted, fontSize: 13, fontWeight: '700' },
              view === 'month' && { color: colors.onBrand },
            ]}
          >
            {t('tasks.viewMonth')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.yearRow}>
        <Pressable onPress={() => setYear((value) => value - 1)} style={[styles.yearBtn, { borderColor: colors.line }]}>
          <Text style={[styles.yearBtnText, { color: colors.ink }]}>‹</Text>
        </Pressable>
        <Text style={[styles.yearLabel, { color: colors.ink }]}>{year}</Text>
        <Pressable onPress={() => setYear((value) => value + 1)} style={[styles.yearBtn, { borderColor: colors.line }]}>
          <Text style={[styles.yearBtnText, { color: colors.ink }]}>›</Text>
        </Pressable>
      </View>

      {view === 'month' ? (
        <View style={styles.yearRow}>
          <Pressable
            onPress={() => {
              if (month === 1) {
                setMonth(12);
                setYear((value) => value - 1);
                return;
              }
              setMonth((value) => value - 1);
            }}
            style={[styles.yearBtn, { borderColor: colors.line }]}
          >
            <Text style={[styles.yearBtnText, { color: colors.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.yearLabel, { color: colors.ink }]}>{formatMonthTitle(year, month, language)}</Text>
          <Pressable
            onPress={() => {
              if (month === 12) {
                setMonth(1);
                setYear((value) => value + 1);
                return;
              }
              setMonth((value) => value + 1);
            }}
            style={[styles.yearBtn, { borderColor: colors.line }]}
          >
            <Text style={[styles.yearBtnText, { color: colors.ink }]}>›</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.grid}>
        <View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{t('tasks.statTotal')}</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{totals.total}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{t('tasks.statCompleted')}</Text>
          <Text style={[styles.statValue, { color: colors.brand }]}>{totals.completed}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{t('tasks.statPending')}</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{totals.pending + totals.overdue}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{t('tasks.completionRate')}</Text>
          <Text style={[styles.statValue, { color: colors.brand }]}>{completion}%</Text>
        </View>
      </View>

      {view === 'year' ? (
        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('tasks.historyByMonth')}</Text>
          {byMonth.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('tasks.emptyPeriod')}</Text>
          ) : (
            byMonth.map((item) => {
              const rate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
              return (
                <Pressable
                  key={item.month}
                  onPress={() => {
                    setMonth(item.month);
                    setView('month');
                  }}
                  style={[styles.monthRow, { borderColor: colors.line }]}
                >
                  <Text style={[styles.monthName, { color: colors.ink }]}>
                    {formatMonthTitle(year, item.month, language)}
                  </Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    {t('tasks.monthStats', { completed: item.completed, total: item.total })}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
                    <View style={[styles.barFill, { width: `${clampPercent(rate)}%`, backgroundColor: colors.brand }]} />
                  </View>
                  <Text style={[styles.rate, { color: colors.brand }]}>
                    {rate}% · {item.minutesDone}/{item.minutes} {t('today.min')}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('tasks.historyByDay')}</Text>
          {(data?.days ?? []).length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t('tasks.emptyPeriod')}</Text>
          ) : (
            (data?.days ?? []).map((day) => (
              <View key={day.date} style={[styles.dayRow, { borderColor: colors.line }]}>
                <View>
                  <Text style={[styles.monthName, { color: colors.ink }]}>{day.date}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    {t('tasks.monthStats', { completed: day.completed, total: day.total })}
                  </Text>
                </View>
                <Text style={[styles.rate, { color: colors.brand }]}>
                  {day.minutesDone}/{day.minutes} {t('today.min')}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  error: { fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  yearRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  yearBtn: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  yearBtnText: { fontSize: 22, fontWeight: '700' },
  yearLabel: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    padding: 14,
    width: '47%',
  },
  statLabel: { fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { fontSize: 14, paddingVertical: 8 },
  monthRow: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  monthName: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  barTrack: { borderRadius: 999, height: 8, marginTop: 10, overflow: 'hidden' },
  barFill: { borderRadius: 999, height: '100%' },
  rate: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  dayRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 12,
  },
});
