import { apiClient } from './client';
import type { RhythmHabit, RhythmPeriodResponse } from '../types/rhythm';

export const rhythmApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<RhythmPeriodResponse>(`/api/rhythm?year=${year}&month=${month}`),
  createHabit: (title: string) => apiClient.post<{ habit: RhythmHabit }>('/api/rhythm/habits', { title }),
  updateHabit: (id: string, title: string) =>
    apiClient.patch<{ habit: RhythmHabit }>(`/api/rhythm/habits/${id}`, { title }),
  removeHabit: (id: string) => apiClient.delete<{ success: boolean }>(`/api/rhythm/habits/${id}`),
  setCheck: (habitId: string, date: string, done: boolean) =>
    apiClient.put<{ check: { habitId: string; date: string; done: boolean } }>('/api/rhythm/checks', {
      habitId,
      date,
      done,
    }),
};
