import { addDays, addMonths, addWeeks } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay } from 'date-fns';
import type { TaskRecurrenceType } from '@prisma/client';

/** Local calendar midnight stored as UTC instant for the user timezone. */
export function localDateToUtc(date: Date | string, timezone: string): Date {
  const input = typeof date === 'string' ? new Date(date) : date;
  const zoned = toZonedTime(input, timezone);
  const localMidnight = startOfDay(zoned);
  return fromZonedTime(localMidnight, timezone);
}

export function formatLocalDateKey(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  const y = zoned.getFullYear();
  const m = String(zoned.getMonth() + 1).padStart(2, '0');
  const d = String(zoned.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(key: string, timezone: string): Date {
  const parts = key.split('-').map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const local = new Date(y, m - 1, d, 0, 0, 0, 0);
  return fromZonedTime(local, timezone);
}

export function getWeekdayIndex(date: Date, timezone: string): number {
  return toZonedTime(date, timezone).getDay();
}

export type RecurrenceInput = {
  recurrenceType: TaskRecurrenceType;
  intervalDays?: number | null;
};

export function getNextDueDate(
  fromDueDate: Date,
  recurrence: RecurrenceInput,
  timezone: string,
): Date {
  const zoned = toZonedTime(fromDueDate, timezone);
  const localStart = startOfDay(zoned);

  let nextLocal: Date;
  switch (recurrence.recurrenceType) {
    case 'DAILY':
      nextLocal = addDays(localStart, 1);
      break;
    case 'WEEKLY':
      nextLocal = addWeeks(localStart, 1);
      break;
    case 'MONTHLY':
      nextLocal = addMonths(localStart, 1);
      break;
    case 'CUSTOM_DAYS': {
      const days = recurrence.intervalDays && recurrence.intervalDays > 0 ? recurrence.intervalDays : 1;
      nextLocal = addDays(localStart, days);
      break;
    }
    default:
      nextLocal = addDays(localStart, 1);
  }

  return fromZonedTime(nextLocal, timezone);
}
