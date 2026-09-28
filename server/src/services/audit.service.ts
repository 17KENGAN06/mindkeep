import type { AdminAuditAction } from '@prisma/client';
import { logger } from '@/config/logger.js';
import { prisma } from '@/config/prisma.js';

type RecordAuditInput = {
  action: AdminAuditAction;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
};

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
