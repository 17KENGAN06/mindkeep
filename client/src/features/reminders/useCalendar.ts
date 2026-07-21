import { useQuery } from '@tanstack/react-query';
import { remindersApi } from '@/api/reminders';

export function useReminderCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['reminders', 'calendar', year, month],
    queryFn: () => remindersApi.calendar(year, month),
  });
}
