import type { Reminder } from '@/types/reminder';

export type CalendarDaySummary = {
  date: string;
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  skipped: number;
};

export type CalendarReminder = Reminder & {
  localDate: string;
};

export type CalendarResponse = {
  timezone: string;
  year: number;
  month: number;
  days: CalendarDaySummary[];
  reminders: CalendarReminder[];
};
