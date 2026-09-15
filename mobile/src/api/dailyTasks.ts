import { apiClient } from './client';
import type {
  CreateDailyTaskPayload,
  DailyTask,
  DailyTaskDayResponse,
  DailyTaskPeriodResponse,
} from '../types/dailyTask';

export const dailyTasksApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<DailyTaskPeriodResponse>(`/api/tasks?view=month&year=${year}&month=${month}`),
  getDay: (date: string) =>
    apiClient.get<DailyTaskDayResponse>(`/api/tasks/day?date=${encodeURIComponent(date)}`),
  create: (payload: CreateDailyTaskPayload) =>
    apiClient.post<{ task: DailyTask }>('/api/tasks', payload),
  update: (id: string, payload: { completed?: boolean }) =>
    apiClient.patch<{ task: DailyTask }>(`/api/tasks/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/tasks/${id}`),
};
