import { MaterialStatus, ReminderStatus, type Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { buildReviewSchedule } from '@/services/reviewScheduleService.js';
import type {
  CreateMaterialInput,
  ListMaterialsQuery,
  UpdateMaterialInput,
} from '@/validations/material.schemas.js';
import { AppError } from '@/utils/AppError.js';

const materialInclude = {
  category: {
    select: { id: true, name: true },
  },
  reminders: {
    orderBy: { sequenceNumber: 'asc' as const },
    select: {
      id: true,
      intervalType: true,
      sequenceNumber: true,
      scheduledAt: true,
      status: true,
      completedAt: true,
    },
  },
} satisfies Prisma.LearningMaterialInclude;

function nextReminderDate(
  reminders: Array<{ scheduledAt: Date; status: ReminderStatus }>,
): Date | null {
  const upcoming = reminders
    .filter((reminder) => reminder.status === ReminderStatus.PENDING || reminder.status === ReminderStatus.OVERDUE)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return upcoming[0]?.scheduledAt ?? null;
}

async function assertCategoryOwnership(userId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError('Category not found', {
      statusCode: 404,
      code: 'CATEGORY_NOT_FOUND',
    });
  }
}

export class MaterialService {
  async list(userId: string, query: ListMaterialsQuery) {
    const materials = await prisma.learningMaterial.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { content: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: materialInclude,
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((material) => ({
      ...material,
      nextReviewAt: nextReminderDate(material.reminders),
    }));
  }

  async getById(userId: string, id: string) {
    const material = await prisma.learningMaterial.findFirst({
      where: { id, userId },
      include: materialInclude,
    });

    if (!material) {
      throw new AppError('Material not found', {
        statusCode: 404,
        code: 'MATERIAL_NOT_FOUND',
      });
    }

    return {
      ...material,
      nextReviewAt: nextReminderDate(material.reminders),
    };
  }

  async create(userId: string, input: CreateMaterialInput) {
    await assertCategoryOwnership(userId, input.categoryId);

    const learnedAt = new Date(input.learnedAt);
    const schedule = buildReviewSchedule(learnedAt);

    const material = await prisma.$transaction(async (tx) => {
      const created = await tx.learningMaterial.create({
        data: {
          title: input.title,
          description: input.description,
          content: input.content,
          question: input.question,
          answer: input.answer,
          sourceUrl: input.sourceUrl,
          learnedAt,
          categoryId: input.categoryId ?? null,
          userId,
          status: MaterialStatus.ACTIVE,
          reminders: {
            create: schedule.map((item) => ({
              intervalType: item.intervalType,
              sequenceNumber: item.sequenceNumber,
              scheduledAt: item.scheduledAt,
              status: ReminderStatus.PENDING,
              userId,
            })),
          },
        },
        include: materialInclude,
      });

      return created;
    });

    return {
      ...material,
      nextReviewAt: nextReminderDate(material.reminders),
    };
  }

  async update(userId: string, id: string, input: UpdateMaterialInput) {
    const existing = await this.getById(userId, id);

    if (input.categoryId !== undefined) {
      await assertCategoryOwnership(userId, input.categoryId);
    }

    const learnedAtChanged =
      input.learnedAt !== undefined &&
      new Date(input.learnedAt).getTime() !== existing.learnedAt.getTime();

    if (learnedAtChanged) {
      const hasCompletedOrSkipped = existing.reminders.some(
        (reminder) =>
          reminder.status === ReminderStatus.COMPLETED || reminder.status === ReminderStatus.SKIPPED,
      );

      if (hasCompletedOrSkipped) {
        throw new AppError('Cannot change learnedAt after reminders were completed or skipped', {
          statusCode: 400,
          code: 'LEARNED_AT_LOCKED',
        });
      }
    }

    const material = await prisma.$transaction(async (tx) => {
      const updated = await tx.learningMaterial.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.question !== undefined ? { question: input.question } : {}),
          ...(input.answer !== undefined ? { answer: input.answer } : {}),
          ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
          ...(input.learnedAt !== undefined ? { learnedAt: new Date(input.learnedAt) } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        include: materialInclude,
      });

      if (learnedAtChanged && input.learnedAt) {
        const schedule = buildReviewSchedule(new Date(input.learnedAt));

        for (const item of schedule) {
          await tx.reviewReminder.update({
            where: {
              materialId_intervalType: {
                materialId: id,
                intervalType: item.intervalType,
              },
            },
            data: {
              scheduledAt: item.scheduledAt,
              status: ReminderStatus.PENDING,
              completedAt: null,
              notificationCreatedAt: null,
            },
          });
        }

        return tx.learningMaterial.findFirstOrThrow({
          where: { id },
          include: materialInclude,
        });
      }

      return updated;
    });

    return {
      ...material,
      nextReviewAt: nextReminderDate(material.reminders),
    };
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);

    await prisma.learningMaterial.delete({
      where: { id },
    });

    return { success: true as const };
  }

  async archive(userId: string, id: string) {
    await this.getById(userId, id);

    const material = await prisma.learningMaterial.update({
      where: { id },
      data: { status: MaterialStatus.ARCHIVED },
      include: materialInclude,
    });

    return {
      ...material,
      nextReviewAt: nextReminderDate(material.reminders),
    };
  }
}

export const materialService = new MaterialService();
