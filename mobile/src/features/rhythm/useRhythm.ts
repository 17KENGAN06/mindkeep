import { useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rhythmApi } from '../../api/rhythm';

const rhythmKey = ['rhythm'] as const;

export function useRhythmPeriod(year: number, month: number) {
  return useQuery({
    queryKey: [...rhythmKey, year, month],
    queryFn: () => rhythmApi.getPeriod(year, month),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function usePrefetchRhythmNeighbors(year: number, month: number) {
  const queryClient = useQueryClient();
  useEffect(() => {
    for (const delta of [-1, 1]) {
      const next = new Date(year, month - 1 + delta, 1);
      const nextYear = next.getFullYear();
      const nextMonth = next.getMonth() + 1;
      void queryClient.prefetchQuery({
        queryKey: [...rhythmKey, nextYear, nextMonth],
        queryFn: () => rhythmApi.getPeriod(nextYear, nextMonth),
        staleTime: 30_000,
      });
    }
  }, [month, queryClient, year]);
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
