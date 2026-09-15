import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyTasksApi } from '../../api/dailyTasks';
import type { CreateDailyTaskPayload } from '../../types/dailyTask';

const tasksKey = ['tasks'] as const;

function invalidateTasks(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: tasksKey });
}

export function useTasksPeriod(year: number, month: number) {
  return useQuery({
    queryKey: [...tasksKey, 'period', year, month],
    queryFn: () => dailyTasksApi.getPeriod(year, month),
  });
}

export function useTodayTasks(date: string) {
  return useQuery({
    queryKey: [...tasksKey, 'day', date],
    queryFn: () => dailyTasksApi.getDay(date),
  });
}

export function useToggleTask(date?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      dailyTasksApi.update(id, { completed }),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      if (date) {
        void queryClient.invalidateQueries({ queryKey: [...tasksKey, 'day', date] });
      }
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDailyTaskPayload) => dailyTasksApi.create(payload),
    onSuccess: () => {
      void invalidateTasks(queryClient);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyTasksApi.remove(id),
    onSuccess: () => {
      void invalidateTasks(queryClient);
    },
  });
}
