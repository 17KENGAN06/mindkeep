import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../components/ui';
import { useAuth } from '../../features/auth/useAuth';
import {
  useAdminOverview,
  useAdminReviews,
  useAdminUsers,
  useModerateReview,
} from '../../features/admin/useAdmin';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import { formatDate } from '../../utils/date';

export function AdminScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const { user } = useAuth();
  const enabled = user?.role === 'ADMIN';
  const overviewQuery = useAdminOverview(enabled);
  const usersQuery = useAdminUsers(enabled);
  const reviewsQuery = useAdminReviews(enabled);
  const moderate = useModerateReview();
  const loading =
    enabled &&
    ((overviewQuery.isLoading && !overviewQuery.data) ||
      (usersQuery.isLoading && !usersQuery.data) ||
      (reviewsQuery.isLoading && !reviewsQuery.data));

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
  const reviews = reviewsQuery.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={
            (overviewQuery.isRefetching || usersQuery.isRefetching || reviewsQuery.isRefetching) &&
            !loading
          }
          onRefresh={() => {
            void overviewQuery.refetch();
            void usersQuery.refetch();
            void reviewsQuery.refetch();
          }}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('admin.subtitle')}</Text>
      {overviewQuery.isError || usersQuery.isError || reviewsQuery.isError ? (
        <Text style={[styles.error, { color: colors.danger }]}>{t('admin.loadError')}</Text>
      ) : null}

      {overview ? (
        <View style={styles.stats}>
          {(
            [
              [t('admin.stats.users'), overview.usersTotal],
              [t('admin.stats.admins'), overview.adminsTotal],
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

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.reviewsTitle')}</Text>
      {reviews.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.reviewsEmpty')}</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{review.user.name}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{review.user.email}</Text>
            <Text style={[styles.meta, { color: colors.brand }]}>
              {review.rating}★ · {t(`admin.reviewStatus.${review.status}`)}
            </Text>
            <Text style={[styles.body, { color: colors.ink }]}>{review.text}</Text>
            {review.location ? <Text style={[styles.meta, { color: colors.muted }]}>{review.location}</Text> : null}
            <View style={styles.actions}>
              <AppButton
                label={t('admin.approveReview')}
                disabled={review.status === 'APPROVED' || moderate.isPending}
                onPress={() => moderate.mutate({ id: review.id, status: 'APPROVED' })}
              />
              <AppButton
                variant="secondary"
                label={t('admin.rejectReview')}
                disabled={review.status === 'REJECTED' || moderate.isPending}
                onPress={() => moderate.mutate({ id: review.id, status: 'REJECTED' })}
              />
            </View>
          </View>
        ))
      )}

      <Text style={[styles.section, { color: colors.ink }]}>{t('admin.usersTitle')}</Text>
      {users.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t('admin.empty')}</Text>
      ) : (
        users.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.name}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{item.email}</Text>
            <Text style={[styles.meta, { color: colors.ink }]}>
              {item.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')} · {item.timezone}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {t('admin.columns.materials')}: {item.materialsCount} · {t('admin.columns.reminders')}:{' '}
              {item.remindersCount}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {t('admin.columns.created')}: {formatDate(item.createdAt, language)}
            </Text>
          </View>
        ))
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
  body: { fontSize: 14, lineHeight: 20 },
  actions: { gap: 8, marginTop: 8 },
});
