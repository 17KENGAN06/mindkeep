import { apiClient } from './client';
import type {
  CreateDailyTaskPayload,
  DailyTask,
  DailyTaskDayResponse,
  DailyTaskPeriodResponse,
  ForestSummaryResponse,
  UpdateDailyTaskPayload,
} from '../types/dailyTask';

export const dailyTasksApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<DailyTaskPeriodResponse>(`/api/tasks?view=month&year=${year}&month=${month}`),
  getYear: (year: number) =>
    apiClient.get<DailyTaskPeriodResponse>(`/api/tasks?view=year&year=${year}`),
  getDay: (date: string) =>
    apiClient.get<DailyTaskDayResponse>(`/api/tasks/day?date=${encodeURIComponent(date)}`),
  getForest: (year: number, month: number) =>
    apiClient.get<ForestSummaryResponse>(`/api/tasks/forest?year=${year}&month=${month}`),
  create: (payload: CreateDailyTaskPayload) =>
    apiClient.post<{ task: DailyTask }>('/api/tasks', payload),
  update: (id: string, payload: UpdateDailyTaskPayload) =>
    apiClient.patch<{ task: DailyTask }>(`/api/tasks/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/tasks/${id}`),
};
