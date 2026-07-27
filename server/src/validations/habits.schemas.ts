import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const updateHabitSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const habitIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleHabitLogSchema = z.object({
  date: z.string().min(1).optional(),
  completed: z.boolean().optional().default(true),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ToggleHabitLogInput = z.infer<typeof toggleHabitLogSchema>;
