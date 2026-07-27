import { TaskOccurrenceStatus } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { logger } from '@/config/logger.js';
import { getDayBoundsInTimeZone } from '@/utils/timezone.js';

/** Mark pending planner occurrences as overdue for all users (local midnight). */
export async function runPlannerOverdueJob(): Promise<{ updated: number }> {
  const users = await prisma.user.findMany({
    select: { id: true, timezone: true },
  });

  let updated = 0;

  for (const user of users) {
    const timezone = user.timezone || 'Europe/Helsinki';
    const { startUtc } = getDayBoundsInTimeZone(timezone);

    const result = await prisma.taskOccurrence.updateMany({
      where: {
        userId: user.id,
        status: TaskOccurrenceStatus.PENDING,
        dueDate: { lt: startUtc },
      },
      data: { status: TaskOccurrenceStatus.OVERDUE },
    });

    updated += result.count;
  }

  logger.info('Planner overdue job finished', { updated, users: users.length });
  return { updated };
}
