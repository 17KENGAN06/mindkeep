import type { ReminderIntervalType, ReminderStatus } from '@/types/material';

export type ReminderMaterial = {
  id: string;
  title: string;
  learnedAt: string;
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
  materialId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  daysOverdue: number;
  material: ReminderMaterial;
};
