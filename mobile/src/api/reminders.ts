import { apiClient } from './client';
import type { CalendarResponse } from '../types/calendar';
import type { Reminder } from '../types/reminder';

export const remindersApi = {
  today: () => apiClient.get<{ reminders: Reminder[] }>('/api/reminders/today'),
  overdue: () => apiClient.get<{ reminders: Reminder[] }>('/api/reminders/overdue'),
  upcoming: () => apiClient.get<{ reminders: Reminder[] }>('/api/reminders/upcoming'),
  calendar: (year: number, month: number) =>
    apiClient.get<CalendarResponse>(`/api/reminders/calendar?year=${year}&month=${month}`),
  complete: (id: string) =>
    apiClient.post<{ reminder: Reminder; message: string }>(`/api/reminders/${id}/complete`),
  skip: (id: string) =>
    apiClient.post<{ reminder: Reminder; message: string }>(`/api/reminders/${id}/skip`),
};
