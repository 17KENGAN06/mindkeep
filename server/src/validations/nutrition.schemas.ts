import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const nutritionPeriodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const updateNutritionSettingsSchema = z
  .object({
    calorieGoal: z.coerce.number().int().min(500).max(10000).optional(),
    waterGoal: z.coerce.number().int().min(1).max(20).optional(),
    weightGoal: z.number().min(20).max(400).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const createMealSchema = z.object({
  title: z.string().trim().min(1).max(120),
  calories: z.coerce.number().int().min(1).max(10000),
  date: dateOnly,
});

export const updateMealSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    calories: z.coerce.number().int().min(1).max(10000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const mealIdParamsSchema = z.object({
  id: z.string().cuid('Invalid meal id'),
});

export const upsertWaterSchema = z.object({
  date: dateOnly,
  glasses: z.coerce.number().int().min(0).max(30),
});

export const upsertWeightSchema = z.object({
  date: dateOnly,
  kg: z.coerce.number().min(20).max(400),
});

export type NutritionPeriodQuery = z.infer<typeof nutritionPeriodQuerySchema>;
export type UpdateNutritionSettingsInput = z.infer<typeof updateNutritionSettingsSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type UpsertWaterInput = z.infer<typeof upsertWaterSchema>;
export type UpsertWeightInput = z.infer<typeof upsertWeightSchema>;
