export type MaterialStatus = 'ACTIVE' | 'ARCHIVED';
export type ReminderStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
export type ReminderIntervalType = 'THREE_DAYS' | 'SEVEN_DAYS' | 'THIRTY_DAYS';

export type MaterialReminder = {
  id: string;
  intervalType: ReminderIntervalType;
  sequenceNumber: number;
  scheduledAt: string;
  status: ReminderStatus;
  completedAt: string | null;
};

export type Material = {
  id: string;
  title: string;
  description: string;
  content: string;
  question: string | null;
  answer: string | null;
  sourceUrl: string | null;
  learnedAt: string;
  status: MaterialStatus;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  nextReviewAt: string | null;
  category: { id: string; name: string } | null;
  reminders: MaterialReminder[];
};
