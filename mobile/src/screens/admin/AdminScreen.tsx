import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/useAuth';
import {
  useAdminAudit,
  useAdminBetaTesters,
  useAdminOverview,
  useAdminSubscribers,
  useAdminUsers,
  useSetBetaTester,
} from '../../features/admin/useAdmin';
import { AppButton } from '../../components/ui';
import type { AdminUser } from '../../api/admin';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { MoreStackParamList } from '../../navigation/types';
import { formatDate } from '../../utils/date';

const BETA_SEARCH_LIMIT = 8;

/** Same ranking as the site: exact, prefix, email local part, then substring. */
function matchBetaUsers(users: AdminUser[], query: string): AdminUser[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return users
    .map((user) => {
      const name = user.name.toLowerCase();
      const email = user.email.toLowerCase();
      let score = 99;
      if (name === needle || email === needle) score = 0;
      else if (name.startsWith(needle) || email.startsWith(needle)) score = 1;
      else if (email.split('@')[0]?.startsWith(needle)) score = 2;
      else if (`${name} ${email}`.includes(needle)) score = 3;
      return { user, score };
    })
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || a.user.name.localeCompare(b.user.name))
    .slice(0, BETA_SEARCH_LIMIT)
    .map((item) => item.user);
}

export function AdminScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { user } = useAuth();
  const enabled = user?.role === 'ADMIN';
  const overviewQuery = useAdminOverview(enabled);
  const usersQuery = useAdminUsers(enabled);
  const subscribersQuery = useAdminSubscribers(enabled);
  const testersQuery = useAdminBetaTesters(enabled);
  const auditQuery = useAdminAudit(enabled);
  const setBeta = useSetBetaTester();
  const [betaQuery, setBetaQuery] = useState('');
  const loading =
    enabled &&
    ((overviewQuery.isLoading && !overviewQuery.data) || (usersQuery.isLoading && !usersQuery.data));

  if (!enabled) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{t('admin.loadError')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const overview = overviewQuery.data;
  const users = usersQuery.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={(overviewQuery.isRefetching || usersQuery.isRefetching) && !loading}
          onRefresh={() => {
            void overviewQuery.refetch();
            void usersQuery.refetch();
            void subscribersQuery.refetch();
            void testersQuery.refetch();
            void auditQuery.refetch();
          }}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('admin.subtitle')}</Text>
      {overviewQuery.isError || usersQuery.isError ? (
        <Text style={[styles.error, { color: colors.danger }]}>{t('admin.loadError')}</Text>
      ) : null}

      {overview ? (
        <View style={styles.stats}>
          {(
            [
              [t('admin.stats.users'), overview.usersTotal],
              [t('admin.stats.admins'), overview.adminsTotal],
              [t('admin.stats.subscribers'), overview.subscribersTotal ?? '—'],
              [t('admin.stats.beta'), overview.betaTestersTotal ?? '—'],
              [t('admin.stats.materials'), overview.materialsTotal],
              [t('admin.stats.reminders'), overview.remindersTotal],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.line }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
              <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Subscribers */}
      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.subscribersTitle')}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{t('admin.subscribersHint')}</Text>
      {(subscribersQuery.data ?? []).length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.subscribersEmpty')}</Text>
      ) : (
        (subscribersQuery.data ?? []).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate('AdminUser', { id: item.id })}
            style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.name}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{item.email}</Text>
            <Text style={[styles.meta, { color: colors.ink }]}>
              {item.planInterval === 'YEAR'
                ? t('billing.yearCard')
                : item.planInterval === 'MONTH'
                  ? t('billing.monthCard')
                  : t('billing.proLabel')}
              {item.planExpiresAt
                ? ` · ${formatDate(item.planExpiresAt, language)}${item.cancelAtPeriodEnd ? ` · ${t('billing.cancelScheduled')}` : ''}`
                : ''}
            </Text>
          </Pressable>
        ))
      )}

      {/* Beta testers */}
      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.betaTitle')}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{t('admin.betaHint')}</Text>
      <Text style={[styles.label, { color: colors.ink }]}>{t('admin.betaSelect')}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        value={betaQuery}
        onChangeText={setBetaQuery}
        placeholder={t('admin.betaSelectPlaceholder')}
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink }]}
      />
      {betaQuery.trim() ? (
        <View style={[styles.matches, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          {matchBetaUsers(users.filter((item) => item.role !== 'ADMIN' && !item.betaTester), betaQuery).length === 0 ? (
            <Text style={[styles.meta, { color: colors.muted }]}>{t('admin.betaSearchEmpty')}</Text>
          ) : (
            matchBetaUsers(users.filter((item) => item.role !== 'ADMIN' && !item.betaTester), betaQuery).map((item) => (
              <View key={item.id} style={styles.matchRow}>
                <View style={styles.matchCopy}>
                  <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>{item.email}</Text>
                </View>
                <AppButton
                  label={t('admin.betaGrant')}
                  disabled={setBeta.isPending}
                  onPress={() => {
                    setBeta.mutate({ id: item.id, betaTester: true });
                    setBetaQuery('');
                  }}
                />
              </View>
            ))
          )}
        </View>
      ) : null}
      {(testersQuery.data ?? []).length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.betaEmpty')}</Text>
      ) : (
        (testersQuery.data ?? []).map((item) => (
          <View key={item.id} style={[styles.card, styles.matchRow, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Pressable style={styles.matchCopy} onPress={() => navigation.navigate('AdminUser', { id: item.id })}>
              <Text style={[styles.cardTitle, { color: colors.ink }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>{item.email}</Text>
            </Pressable>
            <AppButton
              variant="secondary"
              label={t('admin.betaRevoke')}
              disabled={setBeta.isPending}
              onPress={() => setBeta.mutate({ id: item.id, betaTester: false })}
            />
          </View>
        ))
      )}

      {/* Audit log */}
      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.auditTitle')}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{t('admin.auditHint')}</Text>
      {(auditQuery.data ?? []).length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.auditEmpty')}</Text>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          {(auditQuery.data ?? []).map((event) => (
            <View key={event.id} style={styles.auditRow}>
              <Text style={[styles.meta, styles.matchCopy, { color: colors.ink }]}>
                {event.actor?.name ?? t('admin.auditAnonymous')}
                <Text style={{ color: colors.muted }}> · {t(`admin.auditActions.${event.action}`)}</Text>
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]}>{formatDate(event.createdAt, language)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.usersTitle')}</Text>
      {users.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.empty')}</Text>
      ) : (
        users.map((item) => {
          const modules = item.modules ?? [];
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate('AdminUser', { id: item.id })}
              style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}
            >
              <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>{item.email}</Text>
              <Text style={[styles.meta, { color: colors.ink }]}>
                {item.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
              </Text>
              <Text style={[styles.meta, { color: colors.ink }]}>
                {modules.length === 0
                  ? t('admin.idle')
                  : modules.map((moduleId) => t(`admin.modules.${moduleId}`)).join(' · ')}
              </Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                {item.lastActivityAt
                  ? `${t('admin.columns.lastActivity')}: ${formatDate(item.lastActivityAt, language)}`
                  : t('admin.noActivity')}
              </Text>
              <Text style={[styles.meta, { color: colors.brand }]}>{t('admin.openStats')}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  error: { fontSize: 14 },
  empty: { fontSize: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 6 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, gap: 6, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 46, paddingHorizontal: 12 },
  matches: { borderRadius: 16, borderWidth: 1, gap: 10, padding: 10 },
  matchRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  matchCopy: { flex: 1, minWidth: 0 },
  auditRow: { alignItems: 'baseline', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
});
