import { z } from 'zod';

export function createCategorySchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t('categories.errors.required')).max(80),
  });
}

export type CategoryFormValues = z.infer<ReturnType<typeof createCategorySchema>>;
