import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PullRefreshControl } from '../../components/PullRefreshControl';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useTranslation } from 'react-i18next';
import { InlineQueryError } from '../../components/QueryState';
import { useActivityStatistics, useDashboardStatistics } from '../../features/statistics/useStatistics';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import { formatDate } from '../../utils/date';
import { fonts } from '../../config/fonts';

export function StatisticsScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('statistics');
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();
  const loading = (dashboardQuery.isLoading && !dashboardQuery.data) || (activityQuery.isLoading && !activityQuery.data);
  const refreshing =
    (dashboardQuery.isRefetching || activityQuery.isRefetching) && !loading;
  const stats = dashboardQuery.data?.stats;
  const activity = activityQuery.data?.activity ?? [];
  const max = useMemo(() => Math.max(...activity.map((point) => point.count), 1), [activity]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <SectionScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={
        <PullRefreshControl
          busy={refreshing}
          onRefresh={() => {
            void dashboardQuery.refetch();
            void activityQuery.refetch();
          }}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('statistics.subtitle')}</Text>
      {dashboardQuery.isError || activityQuery.isError ? (
        <InlineQueryError error={dashboardQuery.error ?? activityQuery.error} />
      ) : null}
      {stats ? (
        <View style={styles.stats}>
          {(
            [
              ['dashboard.stats.activeMaterials', stats.activeMaterials],
              ['dashboard.stats.todayReminders', stats.todayReminders],
              ['dashboard.stats.overdueReminders', stats.overdueReminders],
              ['dashboard.stats.completedReviews', stats.completedReviews],
            ] as const
          ).map(([key, value]) => (
            <View key={key} style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{t(key)}</Text>
              <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.chart, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={[styles.chartTitle, { color: colors.ink }]}>{t('dashboard.activityTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('dashboard.activitySubtitle')}</Text>
        <View style={styles.bars}>
          {activity.map((point) => {
            const height = Math.max((point.count / max) * 100, point.count > 0 ? 12 : 4);
            return (
              <View key={point.date} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.brand, height: `${height}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.muted }]}>
                  {formatDate(point.date, language).split(' ').slice(0, 2).join(' ')}
                </Text>
                <Text style={[styles.barCount, { color: colors.ink }]}>{point.count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </SectionScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  statLabel: { fontSize: 11, fontFamily: fonts.semibold, textTransform: 'uppercase' },
  statValue: { fontSize: 26, fontFamily: fonts.display, marginTop: 8 },
  chart: { borderRadius: 20, borderWidth: 1, gap: 8, padding: 14 },
  chartTitle: { fontSize: 16, fontFamily: fonts.bold },
  bars: { alignItems: 'flex-end', flexDirection: 'row', gap: 6, minHeight: 140 },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barTrack: { alignItems: 'center', flex: 1, height: 100, justifyContent: 'flex-end', width: '100%' },
  barFill: { borderTopLeftRadius: 8, borderTopRightRadius: 8, minHeight: 4, width: '70%' },
  barLabel: { fontFamily: fonts.regular, fontSize: 9, textAlign: 'center' },
  barCount: { fontSize: 11, fontFamily: fonts.bold },
});
