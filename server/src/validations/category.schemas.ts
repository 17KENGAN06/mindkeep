import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().cuid('Invalid category id'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
