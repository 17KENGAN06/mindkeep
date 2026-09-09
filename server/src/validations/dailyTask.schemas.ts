import { z } from 'zod';

export const dailyTaskPeriodQuerySchema = z
  .object({
    view: z.enum(['month', 'year']).default('month'),
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .transform((value) => {
    if (value.view === 'month' && value.month == null) {
      return { ...value, month: new Date().getUTCMonth() + 1 };
    }
    return value;
  });

export const dailyTaskDayQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createDailyTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  minutes: z.coerce.number().int().min(1).max(24 * 60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(500).optional().default(''),
});

export const updateDailyTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    minutes: z.coerce.number().int().min(1).max(24 * 60).optional(),
    note: z.string().trim().max(500).optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const dailyTaskIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type DailyTaskPeriodQuery = z.infer<typeof dailyTaskPeriodQuerySchema>;
export type CreateDailyTaskInput = z.infer<typeof createDailyTaskSchema>;
export type UpdateDailyTaskInput = z.infer<typeof updateDailyTaskSchema>;
