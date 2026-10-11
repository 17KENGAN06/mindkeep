import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyTasksApi } from '../../api/dailyTasks';
import { touchPlanUsage } from '../billing/planLimit';
import type {
  CreateDailyTaskPayload,
  DailyTask,
  UpdateDailyTaskPayload,
} from '../../types/dailyTask';

const tasksKey = ['tasks'] as const;

function invalidateTasks(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: tasksKey });
}

type QueryClient = ReturnType<typeof useQueryClient>;
type TaskCacheSnapshot = [readonly unknown[], { tasks?: DailyTask[] } | undefined][];

/**
 * Optimistic edit of every cached task list (day, month): the screen answers the tap at once
 * instead of after the round trip. Returns a snapshot to roll back to if the server refuses.
 */
async function patchCachedTasks(
  queryClient: QueryClient,
  update: (tasks: DailyTask[]) => DailyTask[],
): Promise<TaskCacheSnapshot> {
  await queryClient.cancelQueries({ queryKey: tasksKey });
  const snapshot = queryClient.getQueriesData<{ tasks?: DailyTask[] }>({ queryKey: tasksKey });
  for (const [key, data] of snapshot) {
    if (!data || !Array.isArray(data.tasks)) continue;
    queryClient.setQueryData(key, { ...data, tasks: update(data.tasks) });
  }
  return snapshot;
}

function restoreCachedTasks(queryClient: QueryClient, snapshot: TaskCacheSnapshot | undefined) {
  for (const [key, data] of snapshot ?? []) queryClient.setQueryData(key, data);
}

export function useTasksPeriod(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: [...tasksKey, 'period', year, month],
    queryFn: () => dailyTasksApi.getPeriod(year, month),
    enabled,
  });
}

export function useTasksYear(year: number) {
  return useQuery({
    queryKey: [...tasksKey, 'year', year],
    queryFn: () => dailyTasksApi.getYear(year),
  });
}

export function useTodayTasks(date: string, enabled = true) {
  return useQuery({
    queryKey: [...tasksKey, 'day', date],
    queryFn: () => dailyTasksApi.getDay(date),
    enabled: Boolean(date) && enabled,
  });
}

export function useForestSummary(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: [...tasksKey, 'forest', year, month],
    queryFn: () => dailyTasksApi.getForest(year, month),
    enabled,
  });
}

export function useToggleTask(date?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      dailyTasksApi.update(id, { completed }),
    onMutate: async ({ id, completed }) => ({
      snapshot: await patchCachedTasks(queryClient, (tasks) =>
        tasks.map((task) => (task.id === id ? { ...task, completed } : task)),
      ),
    }),
    onError: (_error, _variables, context) => restoreCachedTasks(queryClient, context?.snapshot),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (date) {
        void queryClient.invalidateQueries({ queryKey: [...tasksKey, 'day', date] });
      }
    },
  });
}

export function useUpdateTask(date?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDailyTaskPayload }) =>
      dailyTasksApi.update(id, payload),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      touchPlanUsage(queryClient);
    },
  });
}

export function useBulkCreateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { date: string; tasks: { title: string; minutes: number }[] }) =>
      dailyTasksApi.bulkCreate(payload),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      touchPlanUsage(queryClient);
    },
  });
}

export function useCopyTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { from: string; to: string[] }) => dailyTasksApi.copyDay(payload),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      touchPlanUsage(queryClient);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyTasksApi.remove(id),
    onMutate: async (id) => ({
      snapshot: await patchCachedTasks(queryClient, (tasks) =>
        tasks.filter((task) => task.id !== id),
      ),
    }),
    onError: (_error, _variables, context) => restoreCachedTasks(queryClient, context?.snapshot),
    onSuccess: () => {
      void invalidateTasks(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
