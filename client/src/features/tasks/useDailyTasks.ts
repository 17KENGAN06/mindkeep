import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dailyTasksApi,
  type CreateDailyTaskPayload,
  type UpdateDailyTaskPayload,
} from '@/api/dailyTasks';
import type { DailyTaskPeriodParams } from '@/types/dailyTask';

const tasksKey = ['daily-tasks'] as const;

export function useDailyTasksPeriod(params: DailyTaskPeriodParams) {
  return useQuery({
    queryKey: [...tasksKey, 'period', params],
    queryFn: () => dailyTasksApi.getPeriod(params),
  });
}

export function useDailyTasksDay(date: string | null) {
  return useQuery({
    queryKey: [...tasksKey, 'day', date],
    queryFn: () => dailyTasksApi.getDay(date!),
    enabled: Boolean(date),
  });
}

export function useForestSummary() {
  return useQuery({
    queryKey: [...tasksKey, 'forest'],
    queryFn: () => dailyTasksApi.getForest(),
  });
}

export function useCreateDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDailyTaskPayload) => dailyTasksApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useUpdateDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDailyTaskPayload }) =>
      dailyTasksApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useDeleteDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyTasksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}
