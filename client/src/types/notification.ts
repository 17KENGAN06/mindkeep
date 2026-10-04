export type NotificationType = 'REVIEW_DUE' | 'REVIEW_OVERDUE' | 'TASK_IMPORTANT' | 'SYSTEM';

export type NotificationInboxSummary = {
  unreadCount: number;
  dueToday: number;
  overdue: number;
  important: number;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  materialId: string | null;
  reminderId: string | null;
  dailyTaskId: string | null;
  userId: string;
  createdAt: string;
  material: {
    id: string;
    title: string;
  } | null;
  dailyTask: {
    id: string;
    title: string;
    date: string;
    minutes: number;
    completed: boolean;
    important: boolean;
  } | null;
};
