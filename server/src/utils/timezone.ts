import { endOfDay, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export type DayBounds = {
  startUtc: Date;
  endUtc: Date;
};

/** Calendar day bounds for a user timezone, returned as UTC Date values. */
export function getDayBoundsInTimeZone(timezone: string, at: Date = new Date()): DayBounds {
  const zonedNow = toZonedTime(at, timezone);
  const startLocal = startOfDay(zonedNow);
  const endLocal = endOfDay(zonedNow);

  return {
    startUtc: fromZonedTime(startLocal, timezone),
    endUtc: fromZonedTime(endLocal, timezone),
  };
}

/** Whole calendar days between scheduledAt and "today" in the user timezone. */
export function getCalendarDaysOverdue(
  scheduledAt: Date,
  timezone: string,
  at: Date = new Date(),
): number {
  const { startUtc } = getDayBoundsInTimeZone(timezone, at);
  const scheduledZoned = toZonedTime(scheduledAt, timezone);
  const todayZoned = toZonedTime(startUtc, timezone);

  const scheduledDay = startOfDay(scheduledZoned).getTime();
  const todayDay = startOfDay(todayZoned).getTime();
  const diffMs = todayDay - scheduledDay;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  return days > 0 ? days : 0;
}
