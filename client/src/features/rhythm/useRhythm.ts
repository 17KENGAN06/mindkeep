import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rhythmApi } from '@/api/rhythm';

const rhythmKey = ['rhythm'] as const;

export function useRhythmPeriod(year: number, month: number) {
  return useQuery({
    queryKey: [...rhythmKey, year, month],
    queryFn: () => rhythmApi.getPeriod(year, month),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => rhythmApi.createHabit(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rhythmKey });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => rhythmApi.updateHabit(id, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rhythmKey });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rhythmApi.removeHabit(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rhythmKey });
    },
  });
}

export function useSetHabitCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, done }: { habitId: string; date: string; done: boolean }) =>
      rhythmApi.setCheck(habitId, date, done),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rhythmKey });
    },
  });
}
