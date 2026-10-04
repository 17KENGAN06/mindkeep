export type NotificationType = 'REVIEW_DUE' | 'REVIEW_OVERDUE' | 'TASK_IMPORTANT' | 'SYSTEM';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  materialId: string | null;
  reminderId: string | null;
  dailyTaskId: string | null;
  createdAt: string;
  material: {
    id: string;
    title: string;
  } | null;
};
