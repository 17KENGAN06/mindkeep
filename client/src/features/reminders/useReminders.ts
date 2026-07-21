import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/api/reminders';

const reminderKeys = {
  all: ['reminders'] as const,
  today: ['reminders', 'today'] as const,
  overdue: ['reminders', 'overdue'] as const,
  upcoming: ['reminders', 'upcoming'] as const,
};

export function useTodayReminders() {
  return useQuery({
    queryKey: reminderKeys.today,
    queryFn: async () => {
      const response = await remindersApi.today();
      return response.reminders;
    },
  });
}

export function useOverdueReminders() {
  return useQuery({
    queryKey: reminderKeys.overdue,
    queryFn: async () => {
      const response = await remindersApi.overdue();
      return response.reminders;
    },
  });
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: reminderKeys.upcoming,
    queryFn: async () => {
      const response = await remindersApi.upcoming();
      return response.reminders;
    },
  });
}

function invalidateReminderQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['materials'] });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => invalidateReminderQueries(queryClient),
  });
}

export function useSkipReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remindersApi.skip(id),
    onSuccess: () => invalidateReminderQueries(queryClient),
  });
}
