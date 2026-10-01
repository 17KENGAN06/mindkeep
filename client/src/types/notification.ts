export type NotificationType = 'REVIEW_DUE' | 'REVIEW_OVERDUE' | 'SYSTEM';

export type NotificationInboxSummary = {
  unreadCount: number;
  dueToday: number;
  overdue: number;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  materialId: string | null;
  reminderId: string | null;
  userId: string;
  createdAt: string;
  material: {
    id: string;
    title: string;
  } | null;
};
