import { apiClient } from '@/api/client';
import type {
  DailyTask,
  DailyTaskDayResponse,
  DailyTaskPeriodParams,
  DailyTaskPeriodResponse,
  ForestSummaryResponse,
} from '@/types/dailyTask';

function periodQuery(params: DailyTaskPeriodParams): string {
  const search = new URLSearchParams({
    view: params.view,
    year: String(params.year),
  });
  if (params.view === 'month' && params.month) {
    search.set('month', String(params.month));
  }
  return search.toString();
}

export type CreateDailyTaskPayload = {
  title: string;
  minutes: number;
  date: string;
  note?: string;
};

export type UpdateDailyTaskPayload = {
  title?: string;
  minutes?: number;
  note?: string;
  completed?: boolean;
};

export const dailyTasksApi = {
  getPeriod: (params: DailyTaskPeriodParams) =>
    apiClient.get<DailyTaskPeriodResponse>(`/api/tasks?${periodQuery(params)}`),
  getDay: (date: string) =>
    apiClient.get<DailyTaskDayResponse>(`/api/tasks/day?date=${encodeURIComponent(date)}`),
  getForest: () => apiClient.get<ForestSummaryResponse>('/api/tasks/forest'),
  create: (payload: CreateDailyTaskPayload) =>
    apiClient.post<{ task: DailyTask }>('/api/tasks', payload),
  update: (id: string, payload: UpdateDailyTaskPayload) =>
    apiClient.patch<{ task: DailyTask }>(`/api/tasks/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/tasks/${id}`),
};
