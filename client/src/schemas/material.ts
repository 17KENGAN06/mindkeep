import { z } from 'zod';

export function createMaterialFormSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().trim().min(1, t('materials.errors.titleRequired')).max(200),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    content: z.string().trim().max(20000).optional().or(z.literal('')),
    question: z.string().trim().max(5000).optional().or(z.literal('')),
    answer: z.string().trim().max(5000).optional().or(z.literal('')),
    sourceUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || z.url().safeParse(value).success, {
        message: t('materials.errors.url'),
      }),
    learnedAt: z.string().min(1, t('materials.errors.learnedAtRequired')),
    categoryId: z.string().optional().or(z.literal('')),
  });
}

export type MaterialFormValues = z.infer<ReturnType<typeof createMaterialFormSchema>>;
