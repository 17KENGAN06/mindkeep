import { apiClient } from '@/api/client';
import type { AppNotification } from '@/types/notification';

export const notificationsApi = {
  list: () =>
    apiClient.get<{ notifications: AppNotification[]; unreadCount: number }>(
      '/api/notifications',
    ),
  unreadCount: () => apiClient.get<{ unreadCount: number }>('/api/notifications/unread-count'),
  markRead: (id: string) =>
    apiClient.patch<{ notification: AppNotification }>(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ updated: number }>('/api/notifications/read-all'),
};
