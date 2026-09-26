import { useLayoutEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { AdminActivityModuleId } from '../../api/admin';
import { useAuth } from '../../features/auth/useAuth';
import { useAdminUserActivity } from '../../features/admin/useAdmin';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { formatDate, formatDateLong } from '../../utils/date';

function moduleHint(
  id: AdminActivityModuleId,
  extra: Record<string, number>,
  count: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (id === 'review') {
    return t('admin.moduleHints.review', {
      materials: extra.materials ?? count,
      reminders: extra.reminders ?? 0,
      completed: extra.completed ?? 0,
      pending: extra.pending ?? 0,
    });
  }
  if (id === 'tasks') {
    return t('admin.moduleHints.tasks', {
      count,
      completed: extra.completed ?? 0,
      last30: extra.last30 ?? 0,
    });
  }
  if (id === 'habits') {
    return t('admin.moduleHints.habits', {
      count,
      active: extra.active ?? 0,
      checks: extra.checks ?? 0,
      last30: extra.last30 ?? 0,
    });
  }
  if (id === 'nutrition') {
    return t('admin.moduleHints.nutrition', {
      meals: extra.meals ?? 0,
      water: extra.waterDays ?? 0,
      weight: extra.weightDays ?? 0,
    });
  }
  if (id === 'finance') {
    return t('admin.moduleHints.finance', {
      count,
      income: extra.income ?? 0,
      expense: extra.expense ?? 0,
    });
  }
  return t('admin.moduleHints.notes', { count });
}

export function AdminUserScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'AdminUser'>>();
  const enabled = user?.role === 'ADMIN';
  const activityQuery = useAdminUserActivity(route.params.id, enabled);

  useLayoutEffect(() => {
    const name = activityQuery.data?.user.name;
    navigation.setOptions({ title: name || t('admin.openStats') });
  }, [activityQuery.data?.user.name, navigation, t]);

  if (!enabled) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{t('admin.loadError')}</Text>
      </View>
    );
  }

  if (activityQuery.isLoading && !activityQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (activityQuery.isError || !activityQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{t('admin.loadError')}</Text>
      </View>
    );
  }

  const { user: profile, lastActivityAt, summary, timeline, modules, recent } = activityQuery.data;
  const max = Math.max(...timeline.map((point) => point.count), 1);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={activityQuery.isRefetching && !activityQuery.isLoading}
          onRefresh={() => {
            void activityQuery.refetch();
          }}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('admin.activitySubtitle')}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {t('admin.registered', { date: formatDateLong(profile.createdAt, language) })}
        {' · '}
        {profile.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
      </Text>

      <View style={styles.stats}>
        {(
          [
            [t('admin.summary.modulesUsed'), `${summary.modulesUsed} / ${summary.modulesTotal}`],
            [t('admin.summary.activeDays'), String(summary.activeDays30)],
            [t('admin.summary.events7'), String(summary.events7)],
            [
              t('admin.columns.lastActivity'),
              lastActivityAt ? formatDateLong(lastActivityAt, language) : t('admin.noActivity'),
            ],
          ] as const
        ).map(([label, value]) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
            <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.timelineTitle')}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('admin.timelineHint')}</Text>
      <View style={[styles.chart, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <View style={styles.bars}>
          {timeline.map((point) => {
            const height = Math.max((point.count / max) * 72, point.count > 0 ? 8 : 2);
            return (
              <View key={point.date} style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: point.count > 0 ? colors.brand : colors.line,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.chartMeta}>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {timeline[0] ? formatDate(timeline[0].date, language) : ''}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {t('admin.timelineTotal', { count: summary.events30 })}
          </Text>
        </View>
      </View>

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.modulesTitle')}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('admin.modulesHint')}</Text>
      {modules.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={styles.row}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t(`admin.modules.${item.id}`)}</Text>
            <Text style={[styles.badge, { color: item.used ? colors.brand : colors.muted }]}>
              {item.used ? t('admin.used') : t('admin.idle')}
            </Text>
          </View>
          <Text style={[styles.count, { color: colors.ink }]}>{item.count}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {moduleHint(item.id, item.extra, item.count, t)}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {item.firstAt
              ? t('admin.firstUsed', { date: formatDateLong(item.firstAt, language) })
              : t('admin.neverUsed')}
          </Text>
          {item.lastAt ? (
            <Text style={[styles.meta, { color: colors.muted }]}>
              {t('admin.lastUsed', { date: formatDateLong(item.lastAt, language) })}
            </Text>
          ) : null}
        </View>
      ))}

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.recentTitle')}</Text>
      <Text style={[styles.hint, { color: colors.muted }]}>{t('admin.recentHint')}</Text>
      {recent.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.noActivity')}</Text>
      ) : (
        recent.map((event, index) => (
          <View
            key={`${event.at}-${event.module}-${event.action}-${index}`}
            style={[styles.event, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <Text style={[styles.eventTitle, { color: colors.ink }]}>
              {t(`admin.modules.${event.module}`)} · {t(`admin.actions.${event.action}`)}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{formatDateLong(event.at, language)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  content: { gap: 10, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  error: { fontSize: 14 },
  empty: { fontSize: 14 },
  hint: { fontSize: 13, marginTop: -4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  chart: { borderRadius: 16, borderWidth: 1, padding: 12 },
  bars: { alignItems: 'flex-end', flexDirection: 'row', gap: 2, height: 76 },
  barWrap: { alignItems: 'center', flex: 1, height: 76, justifyContent: 'flex-end' },
  bar: { borderRadius: 2, width: '100%' },
  chartMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, gap: 6, padding: 14 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700' },
  count: { fontSize: 24, fontWeight: '700' },
  meta: { fontSize: 13 },
  event: { borderRadius: 16, borderWidth: 1, gap: 4, padding: 12 },
  eventTitle: { fontSize: 14, fontWeight: '600' },
});
