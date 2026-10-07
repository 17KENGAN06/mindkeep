import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const nutritionPeriodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const bodySexSchema = z.enum(['male', 'female']);
const bodyActivitySchema = z.enum(['sedentary', 'light', 'moderate', 'high', 'athlete']);
const macroGrams = z.coerce.number().min(0).max(2000);

export const updateNutritionSettingsSchema = z
  .object({
    calorieGoal: z.coerce.number().int().min(500).max(10000).optional(),
    waterGoal: z.coerce.number().int().min(1).max(20).optional(),
    stepsGoal: z.coerce.number().int().min(1000).max(100000).optional(),
    weightGoal: z.coerce.number().min(20).max(400).nullable().optional(),
    macrosEnabled: z.boolean().optional(),
    bodySex: bodySexSchema.nullable().optional(),
    bodyAge: z.coerce.number().int().min(10).max(120).nullable().optional(),
    bodyHeightCm: z.coerce.number().int().min(80).max(250).nullable().optional(),
    bodyActivity: bodyActivitySchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const estimateCaloriesSchema = z.object({
  sex: bodySexSchema,
  age: z.coerce.number().int().min(10).max(120),
  heightCm: z.coerce.number().int().min(80).max(250),
  weightKg: z.coerce.number().min(20).max(400),
  activity: bodyActivitySchema,
  targetWeightKg: z.coerce.number().min(20).max(400),
});

export const createMealSchema = z.object({
  title: z.string().trim().min(1).max(120),
  calories: z.coerce.number().int().min(1).max(10000),
  date: dateOnly,
  kind: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'extra']).optional(),
  protein: macroGrams.nullable().optional(),
  fat: macroGrams.nullable().optional(),
  carbs: macroGrams.nullable().optional(),
});

export const updateMealSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    calories: z.coerce.number().int().min(1).max(10000).optional(),
    kind: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'extra']).nullable().optional(),
    protein: macroGrams.nullable().optional(),
    fat: macroGrams.nullable().optional(),
    carbs: macroGrams.nullable().optional(),
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

export const upsertStepsSchema = z.object({
  date: dateOnly,
  done: z.boolean(),
});

export const upsertWeightSchema = z.object({
  date: dateOnly,
  kg: z.coerce.number().min(20).max(400),
});

const foodScanMimeType = z.enum(['image/jpeg', 'image/png', 'image/webp']);

function stripFoodScanDataUrl(value: string): string {
  const trimmed = value.trim();
  const comma = trimmed.indexOf(',');
  return trimmed.startsWith('data:') && comma !== -1 ? trimmed.slice(comma + 1) : trimmed;
}

const scanFoodPhotoSchema = z.object({
  image: z.string().min(80).max(900_000).transform(stripFoodScanDataUrl),
  mimeType: foodScanMimeType,
});

// Control characters in the dish note; stripping them is the point of this pattern.
// eslint-disable-next-line no-control-regex
const NOTE_CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export const scanFoodSchema = z
  .object({
    note: z.string().max(400).optional(),
    images: z.array(scanFoodPhotoSchema).max(3).optional(),
    image: z.string().min(80).max(900_000).optional(),
    mimeType: foodScanMimeType.optional(),
  })
  .transform((value, ctx) => {
    const note = value.note
      ? value.note.replace(NOTE_CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)
      : '';
    const fromLegacy =
      value.image && value.mimeType
        ? [{ image: stripFoodScanDataUrl(value.image), mimeType: value.mimeType }]
        : [];
    const images = (value.images && value.images.length > 0 ? value.images : fromLegacy).slice(0, 3);
    if (images.length < 1 && note.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'Need a photo or a dish description' });
      return z.NEVER;
    }
    return { images, note: note || undefined };
  });

export type NutritionPeriodQuery = z.infer<typeof nutritionPeriodQuerySchema>;
export type UpdateNutritionSettingsInput = z.infer<typeof updateNutritionSettingsSchema>;
export type EstimateCaloriesInput = z.infer<typeof estimateCaloriesSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type UpsertWaterInput = z.infer<typeof upsertWaterSchema>;
export type UpsertStepsInput = z.infer<typeof upsertStepsSchema>;
export type UpsertWeightInput = z.infer<typeof upsertWeightSchema>;
export type ScanFoodInput = z.infer<typeof scanFoodSchema>;
