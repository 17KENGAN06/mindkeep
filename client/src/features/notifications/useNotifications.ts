import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';

const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const response = await notificationsApi.list();
      return response;
    },
  });
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => {
      const response = await notificationsApi.unreadCount();
      return {
        unreadCount: response.unreadCount ?? 0,
        dueToday: response.dueToday ?? 0,
        overdue: response.overdue ?? 0,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationsCount() {
  const query = useNotificationSummary();
  return { ...query, data: query.data?.unreadCount ?? 0 };
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
