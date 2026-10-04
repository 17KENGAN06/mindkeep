import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/useNotifications';
import type { AppLanguage } from '@/i18n';
import type { AppNotification } from '@/types/notification';
import { formatDate } from '@/utils/date';

function typeTone(type: AppNotification['type']) {
  if (type === 'REVIEW_OVERDUE') return 'danger' as const;
  if (type === 'REVIEW_DUE' || type === 'TASK_IMPORTANT') return 'warning' as const;
  return 'neutral' as const;
}

function cardClass(notification: AppNotification) {
  if (notification.type === 'REVIEW_OVERDUE') {
    return notification.isRead ? 'bg-panel ring-red-400/25' : 'bg-red-50/55 ring-red-400/40';
  }
  if (notification.type === 'TASK_IMPORTANT') {
    return notification.isRead
      ? 'bg-panel ring-amber-400/30'
      : 'bg-amber-50/70 ring-amber-400/45';
  }
  return notification.isRead ? 'bg-panel ring-line' : 'bg-brand-50/70 ring-brand-500/30';
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorMessage message={t('auth.errors.generic')} />;

  const { notifications, unreadCount } = data;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notifications.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notifications.subtitle')}</p>
          <p className="mt-2 text-sm font-medium text-brand-500">
            {t('notifications.unreadCount', { count: unreadCount })}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={unreadCount === 0 || markAllRead.isPending}
          isLoading={markAllRead.isPending}
          onClick={() => void markAllRead.mutateAsync()}
        >
          {t('notifications.markAllRead')}
        </Button>
      </section>

      {notifications.length === 0 ? (
        <EmptyState
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyDescription')}
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-2xl p-4 shadow-sm ring-1 ${cardClass(notification)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">{notification.title}</h2>
                    <Badge tone={typeTone(notification.type)}>
                      {t(`notifications.types.${notification.type}`)}
                    </Badge>
                    {!notification.isRead ? (
                      <Badge tone="warning">{t('notifications.unread')}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(notification.createdAt, language)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {notification.materialId ? (
                  <Link to={`/materials/${notification.materialId}`}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!notification.isRead) {
                          void markRead.mutateAsync(notification.id);
                        }
                      }}
                    >
                      {t('notifications.openMaterial')}
                    </Button>
                  </Link>
                ) : null}
                {notification.type === 'TASK_IMPORTANT' || notification.dailyTaskId ? (
                  <Link to="/tasks">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!notification.isRead) {
                          void markRead.mutateAsync(notification.id);
                        }
                      }}
                    >
                      {t('notifications.openTask')}
                    </Button>
                  </Link>
                ) : (
                  <Link to="/review">
                    <Button type="button" variant="ghost">
                      {t('nav.review')}
                    </Button>
                  </Link>
                )}
                {!notification.isRead ? (
                  <Button
                    type="button"
                    variant="ghost"
                    isLoading={markRead.isPending}
                    onClick={() => void markRead.mutateAsync(notification.id)}
                  >
                    {t('notifications.markRead')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
