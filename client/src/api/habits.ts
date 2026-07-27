import { apiClient } from '@/api/client';
import type { Habit, HabitStats } from '@/types/habits';

export const habitsApi = {
  list: () =>
    apiClient.get<{ timezone: string; habits: Habit[]; stats: HabitStats }>('/api/habits'),
  create: (title: string) => apiClient.post<{ habit: Habit }>('/api/habits', { title }),
  update: (id: string, payload: { title?: string; isActive?: boolean }) =>
    apiClient.patch<{ habit: Habit }>(`/api/habits/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/habits/${id}`),
  toggle: (id: string, completed = true, date?: string) =>
    apiClient.post<{ habitId: string; dateKey: string; completed: boolean }>(
      `/api/habits/${id}/toggle`,
      { completed, date },
    ),
};
