import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { AppButton, Badge } from '../../components/ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../features/notifications/useNotifications';
import { useTheme } from '../../features/theme/useTheme';
import type { AppLanguage } from '../../i18n';
import type { AppTabParamList } from '../../navigation/types';
import type { AppNotification } from '../../types/notification';
import { formatDate } from '../../utils/date';

function typeTone(type: AppNotification['type']) {
  if (type === 'REVIEW_OVERDUE') return 'danger' as const;
  if (type === 'REVIEW_DUE') return 'warn' as const;
  return 'neutral' as const;
}

export function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const tabNavigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const listQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = listQuery.data?.notifications ?? [];
  const unreadCount = listQuery.data?.unreadCount ?? 0;

  const openMaterial = (notification: AppNotification) => {
    if (!notification.isRead) {
      void markRead.mutateAsync(notification.id);
    }
    if (notification.materialId) {
      tabNavigation.navigate('Review', {
        screen: 'MaterialDetail',
        params: { id: notification.materialId },
      });
    }
  };

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={listQuery.isRefetching && !listQuery.isLoading}
          onRefresh={() => void listQuery.refetch()}
          tintColor={colors.brand}
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('notifications.subtitle')}</Text>
      <Text style={[styles.unread, { color: colors.brand }]}>
        {t('notifications.unreadCount', { count: unreadCount })}
      </Text>

      <AppButton
        variant="secondary"
        label={t('notifications.markAllRead')}
        disabled={unreadCount === 0}
        loading={markAllRead.isPending}
        onPress={() => void markAllRead.mutateAsync()}
      />

      {listQuery.isError ? (
        <Text style={{ color: colors.danger }}>{t('auth.errors.generic')}</Text>
      ) : null}

      {notifications.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>{t('notifications.emptyTitle')}</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>{t('notifications.emptyDescription')}</Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              styles.card,
              { backgroundColor: colors.panel, borderColor: colors.line },
              !notification.isRead && { borderColor: `${colors.brand}66` },
            ]}
          >
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.ink }]}>{notification.title}</Text>
              <Badge
                tone={typeTone(notification.type)}
                label={t(`notifications.types.${notification.type}`)}
              />
            </View>
            {!notification.isRead ? (
              <Badge tone="warn" label={t('notifications.unread')} />
            ) : null}
            <Text style={[styles.message, { color: colors.muted }]}>{notification.message}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {formatDate(notification.createdAt, language)}
            </Text>

            <View style={styles.actions}>
              {notification.materialId ? (
                <AppButton
                  variant="secondary"
                  label={t('notifications.openMaterial')}
                  onPress={() => openMaterial(notification)}
                />
              ) : null}
              <AppButton
                variant="ghost"
                label={t('tabs.review')}
                onPress={() =>
                  tabNavigation.navigate('Review', { screen: 'ReviewInbox' })
                }
              />
              {!notification.isRead ? (
                <AppButton
                  variant="ghost"
                  label={t('notifications.markRead')}
                  loading={markRead.isPending}
                  onPress={() => void markRead.mutateAsync(notification.id)}
                />
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14 },
  unread: { fontSize: 14, fontWeight: '700' },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyBody: { fontSize: 14, marginTop: 6 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  head: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  message: { fontSize: 14 },
  meta: { fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
