import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '@/api/habits';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => habitsApi.list(),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => habitsApi.create(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      habitsApi.toggle(id, completed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useRemoveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
