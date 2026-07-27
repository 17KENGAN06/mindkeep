import { apiClient } from '@/api/client';
import type {
  PlannerFilter,
  PlannerStats,
  TaskCategory,
  TaskOccurrence,
  TaskRecurrenceType,
} from '@/types/planner';

export type CreateTaskPayload = {
  title: string;
  categoryId?: string | null;
  recurrenceType: TaskRecurrenceType;
  intervalDays?: number | null;
  dueDate: string;
};

export const plannerApi = {
  listCategories: () => apiClient.get<{ categories: TaskCategory[] }>('/api/planner/categories'),
  createCategory: (name: string) =>
    apiClient.post<{ category: TaskCategory }>('/api/planner/categories', { name }),
  removeCategory: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/planner/categories/${id}`),

  createTask: (payload: CreateTaskPayload) =>
    apiClient.post<{ task: unknown }>('/api/planner/tasks', payload),
  updateTask: (id: string, payload: Partial<CreateTaskPayload> & { isActive?: boolean }) =>
    apiClient.patch<{ task: unknown }>(`/api/planner/tasks/${id}`, payload),
  removeTask: (id: string) => apiClient.delete<{ success: boolean }>(`/api/planner/tasks/${id}`),

  listOccurrences: (params: { filter?: PlannerFilter; categoryId?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.filter) search.set('filter', params.filter);
    if (params.categoryId) search.set('categoryId', params.categoryId);
    const query = search.toString();
    return apiClient.get<{ timezone: string; occurrences: TaskOccurrence[] }>(
      `/api/planner/occurrences${query ? `?${query}` : ''}`,
    );
  },
  completeOccurrence: (id: string) =>
    apiClient.post<{ occurrence: TaskOccurrence }>(`/api/planner/occurrences/${id}/complete`),
  rescheduleOccurrence: (id: string, dueDate: string) =>
    apiClient.post<{ occurrence: TaskOccurrence }>(`/api/planner/occurrences/${id}/reschedule`, {
      dueDate,
    }),
  removeOccurrence: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/planner/occurrences/${id}`),
  statistics: () =>
    apiClient.get<{ timezone: string; stats: PlannerStats }>('/api/planner/statistics'),
};
