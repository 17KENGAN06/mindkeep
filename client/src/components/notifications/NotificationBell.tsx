import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnreadNotificationsCount } from '@/features/notifications/useNotifications';

export function NotificationBell() {
  const { t } = useTranslation();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <Link
      to="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink no-underline transition hover:border-brand-400 hover:text-brand-500"
      aria-label={t('notifications.bellLabel', { count: unreadCount })}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
