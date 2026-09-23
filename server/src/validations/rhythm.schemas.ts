import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const HABIT_CYCLE_DAYS = 30;
export const MAX_HABITS = 24;

export const rhythmPeriodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

export const updateHabitSchema = z.object({
  title: z.string().trim().min(1).max(80),
});

export const habitIdParamsSchema = z.object({
  id: z.string().cuid('Invalid habit id'),
});

export const upsertHabitCheckSchema = z.object({
  habitId: z.string().cuid('Invalid habit id'),
  date: dateOnly,
  done: z.boolean(),
});

export type RhythmPeriodQuery = z.infer<typeof rhythmPeriodQuerySchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type UpsertHabitCheckInput = z.infer<typeof upsertHabitCheckSchema>;
