import { apiClient } from './client';
import type { AppNotification, NotificationInboxSummary } from '../types/notification';

export const notificationsApi = {
  list: () =>
    apiClient.get<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications'),
  unreadCount: () => apiClient.get<NotificationInboxSummary>('/api/notifications/unread-count'),
  markRead: (id: string) =>
    apiClient.patch<{ notification: AppNotification }>(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ updated: number }>('/api/notifications/read-all'),
};
