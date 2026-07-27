import { z } from 'zod';

export const taskRecurrenceTypeSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS']);

export const createTaskCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const updateTaskCategorySchema = createTaskCategorySchema;

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    categoryId: z.string().cuid().nullable().optional(),
    recurrenceType: taskRecurrenceTypeSchema,
    intervalDays: z.number().int().min(1).max(365).nullable().optional(),
    dueDate: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.recurrenceType === 'CUSTOM_DAYS' && (!value.intervalDays || value.intervalDays < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'intervalDays is required for CUSTOM_DAYS',
        path: ['intervalDays'],
      });
    }
  });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    categoryId: z.string().cuid().nullable().optional(),
    recurrenceType: taskRecurrenceTypeSchema.optional(),
    intervalDays: z.number().int().min(1).max(365).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.recurrenceType === 'CUSTOM_DAYS' && value.intervalDays != null && value.intervalDays < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'intervalDays must be >= 1',
        path: ['intervalDays'],
      });
    }
  });

export const taskIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const occurrenceIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const rescheduleOccurrenceSchema = z.object({
  dueDate: z.string().min(1),
});

export const listOccurrencesQuerySchema = z.object({
  filter: z
    .enum(['today', 'tomorrow', 'week', 'month', 'overdue', 'completed', 'pending', 'all'])
    .optional()
    .default('today'),
  categoryId: z.string().cuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTaskCategoryInput = z.infer<typeof createTaskCategorySchema>;
export type ListOccurrencesQuery = z.infer<typeof listOccurrencesQuerySchema>;
