import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  dailyTasksApi,
  type CreateDailyTaskPayload,
  type UpdateDailyTaskPayload,
} from '@/api/dailyTasks';
import type { DailyTask, DailyTaskPeriodParams } from '@/types/dailyTask';
import { touchPlanUsage } from '@/features/billing/planLimit';

const tasksKey = ['daily-tasks'] as const;
const updateTaskKey = ['daily-tasks', 'update'] as const;

type TaskProgress = Pick<DailyTask, 'completed' | 'splitDone'>;

/** What a tick (or a split part) does to the task — the same rules as the server. */
function tickedTask(task: DailyTask, payload: UpdateDailyTaskPayload): DailyTask {
  const parts = Math.max(1, task.splitCount ?? 1);
  let { completed } = task;
  let splitDone = task.splitDone ?? 0;
  if (payload.splitDone !== undefined) {
    splitDone = Math.min(Math.max(0, payload.splitDone), parts);
    if (parts > 1) completed = splitDone >= parts;
  }
  if (payload.completed !== undefined) {
    completed = payload.completed;
    if (parts > 1) splitDone = completed ? parts : 0;
  }
  return { ...task, completed, splitDone };
}

/** Changes one task in a cached month / day response; anything else is returned untouched. */
function patchTask(old: unknown, id: string, change: (task: DailyTask) => DailyTask): unknown {
  if (!old || typeof old !== 'object' || !('tasks' in old)) return old;
  const data = old as { tasks: DailyTask[] };
  if (!Array.isArray(data.tasks) || !data.tasks.some((task) => task.id === id)) return old;
  return { ...data, tasks: data.tasks.map((task) => (task.id === id ? change(task) : task)) };
}

export function useDailyTasksPeriod(params: DailyTaskPeriodParams, enabled = true) {
  return useQuery({
    queryKey: [...tasksKey, 'period', params],
    queryFn: () => dailyTasksApi.getPeriod(params),
    enabled,
  });
}

export function useDailyTasksDay(date: string | null) {
  return useQuery({
    queryKey: [...tasksKey, 'day', date],
    queryFn: () => dailyTasksApi.getDay(date!),
    enabled: Boolean(date),
  });
}

export function useCreateDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDailyTaskPayload) => dailyTasksApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useBulkCreateDailyTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { date: string; tasks: { title: string; minutes: number }[] }) =>
      dailyTasksApi.bulkCreate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useCopyDailyTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { from: string; to: string[] }) => dailyTasksApi.copyDay(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useUpdateDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDailyTaskPayload }) =>
      dailyTasksApi.update(id, payload),
    mutationKey: updateTaskKey,
    // Saved one after another, so quick clicks on the same task reach the server in order.
    scope: { id: 'daily-task-update' },
    // Ticks and split parts show at once; the save runs in the background.
    onMutate: async ({ id, payload }) => {
      const tick = payload.completed !== undefined || payload.splitDone !== undefined;
      if (!tick || payload.splitCount !== undefined) return undefined;
      await queryClient.cancelQueries({ queryKey: tasksKey });
      let before: TaskProgress | undefined;
      queryClient.setQueriesData({ queryKey: tasksKey }, (old: unknown) =>
        patchTask(old, id, (task) => {
          before ??= { completed: task.completed, splitDone: task.splitDone };
          return tickedTask(task, payload);
        }),
      );
      return { before };
    },
    onError: (_error, { id }, context) => {
      const before = context?.before;
      if (!before) return;
      queryClient.setQueriesData({ queryKey: tasksKey }, (old: unknown) =>
        patchTask(old, id, (task) => ({ ...task, ...before })),
      );
    },
    onSettled: () => {
      // Reload after the last pending save: an earlier reload would undo newer ticks on screen.
      if (queryClient.isMutating({ mutationKey: updateTaskKey }) > 1) return;
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteDailyTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyTasksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      touchPlanUsage(queryClient);
    },
  });
}
