import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '../../api/reminders';

const reminderKeys = {
  all: ['reminders'] as const,
};

export function useTodayReminders() {
  return useQuery({
    queryKey: ['reminders', 'today'],
    queryFn: async () => {
      const response = await remindersApi.today();
      return response.reminders;
    },
  });
}

export function useOverdueReminders() {
  return useQuery({
    queryKey: ['reminders', 'overdue'],
    queryFn: async () => {
      const response = await remindersApi.overdue();
      return response.reminders;
    },
  });
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: async () => {
      const response = await remindersApi.upcoming();
      return response.reminders;
    },
  });
}

function invalidateReviewQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['materials'] });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => invalidateReviewQueries(queryClient),
  });
}

export function useSkipReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.skip(id),
    onSuccess: () => invalidateReviewQueries(queryClient),
  });
}
