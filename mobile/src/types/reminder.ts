import type { ReminderIntervalType, ReminderStatus } from './material';

export type ReminderMaterial = {
  id: string;
  title: string;
  content: string;
  question: string | null;
  answer: string | null;
  learnedAt: string;
  sourceUrl: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  category: { id: string; name: string } | null;
};

export type Reminder = {
  id: string;
  intervalType: ReminderIntervalType;
  sequenceNumber: number;
  scheduledAt: string;
  status: ReminderStatus;
  completedAt: string | null;
  daysOverdue: number;
  materialId: string;
  material: ReminderMaterial;
};
