import { ReminderIntervalType } from '@prisma/client';
import { addDays } from 'date-fns';

export type ScheduledReview = {
  intervalType: ReminderIntervalType;
  sequenceNumber: number;
  scheduledAt: Date;
};

/**
 * Fixed review schedule from the original learnedAt date (UTC).
 * Intervals never shift based on completion time.
 */
export function buildReviewSchedule(learnedAt: Date): ScheduledReview[] {
  return [
    {
      intervalType: ReminderIntervalType.THREE_DAYS,
      sequenceNumber: 1,
      scheduledAt: addDays(learnedAt, 3),
    },
    {
      intervalType: ReminderIntervalType.SEVEN_DAYS,
      sequenceNumber: 2,
      scheduledAt: addDays(learnedAt, 7),
    },
    {
      intervalType: ReminderIntervalType.THIRTY_DAYS,
      sequenceNumber: 3,
      scheduledAt: addDays(learnedAt, 30),
    },
  ];
}
