import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';

const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationsApi.list(),
  });
}

/** Unread count + what is waiting (due / overdue reviews, important tasks). Polled every minute. */
export function useNotificationSummary() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount() {
  // Same query as the summary, so the bell and the badges never poll twice.
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
    select: (summary) => summary.unreadCount,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}
