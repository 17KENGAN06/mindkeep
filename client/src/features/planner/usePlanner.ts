import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plannerApi, type CreateTaskPayload } from '@/api/planner';
import type { PlannerFilter, TaskRecurrenceType } from '@/types/planner';

export function usePlannerOccurrences(
  filter: PlannerFilter,
  categoryId?: string,
  year?: number,
  month?: number,
) {
  return useQuery({
    queryKey: ['planner', 'occurrences', filter, categoryId, year, month],
    queryFn: async () => {
      const response = await plannerApi.listOccurrences({ filter, categoryId, year, month });
      return response;
    },
  });
}

export function usePlannerCategories() {
  return useQuery({
    queryKey: ['planner', 'categories'],
    queryFn: async () => (await plannerApi.listCategories()).categories,
  });
}

export function usePlannerStatistics() {
  return useQuery({
    queryKey: ['planner', 'statistics'],
    queryFn: async () => (await plannerApi.statistics()).stats,
  });
}

export function useCreatePlannerTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => plannerApi.createTask(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useCompleteOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plannerApi.completeOccurrence(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useRescheduleOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      plannerApi.rescheduleOccurrence(id, dueDate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useRemoveOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plannerApi.removeOccurrence(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useUpdateTaskRecurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      recurrenceType,
      intervalDays,
    }: {
      id: string;
      recurrenceType: TaskRecurrenceType;
      intervalDays?: number | null;
    }) => plannerApi.updateTask(id, { recurrenceType, intervalDays }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => plannerApi.createCategory(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner', 'categories'] });
    },
  });
}
