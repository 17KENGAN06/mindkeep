import type { AdminAuditAction } from '@prisma/client';
import { logger } from '@/config/logger.js';
import { prisma } from '@/config/prisma.js';

type RecordAuditInput = {
  action: AdminAuditAction;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
};

/** How long audit events are kept; older ones are removed by the hourly job. */
export const ADMIN_AUDIT_RETENTION_DAYS = 30;

/**
 * Deletes audit events older than the retention window. Never throws: a failed cleanup
 * must not stop the reminder job it runs with. Returns how many rows were removed.
 */
export async function pruneAdminAudit(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ADMIN_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const { count } = await prisma.adminAuditEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
    if (count > 0) logger.info('Pruned old admin audit events', { count, cutoff: cutoff.toISOString() });
    return count;
  } catch {
    logger.error('Failed to prune admin audit events');
    return 0;
  }
}

export async function recordAdminAudit(input: RecordAuditInput): Promise<void> {
  try {
    await prisma.adminAuditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
      },
    });
  } catch {
    logger.error('Failed to write admin audit event', { action: input.action });
  }
}
