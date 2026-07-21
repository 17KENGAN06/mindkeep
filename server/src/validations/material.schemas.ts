import { MaterialStatus } from '@prisma/client';
import { z } from 'zod';

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const createMaterialSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).default(''),
  content: z.string().trim().max(20000).default(''),
  question: z.string().trim().max(5000).nullable().optional(),
  answer: z.string().trim().max(5000).nullable().optional(),
  sourceUrl: z.union([z.url(), z.literal(''), z.null()]).optional(),
  learnedAt: z.string().datetime({ offset: true }),
  categoryId: z.string().cuid().nullable().optional(),
}).transform((data) => ({
  ...data,
  question: emptyToNull(data.question) ?? null,
  answer: emptyToNull(data.answer) ?? null,
  sourceUrl: emptyToNull(data.sourceUrl) ?? null,
  categoryId: data.categoryId ?? null,
}));

export const updateMaterialSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  content: z.string().trim().max(20000).optional(),
  question: z.string().trim().max(5000).nullable().optional(),
  answer: z.string().trim().max(5000).nullable().optional(),
  sourceUrl: z.union([z.url(), z.literal(''), z.null()]).optional(),
  learnedAt: z.string().datetime({ offset: true }).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  status: z.nativeEnum(MaterialStatus).optional(),
}).transform((data) => ({
  ...data,
  question: emptyToNull(data.question),
  answer: emptyToNull(data.answer),
  sourceUrl: emptyToNull(data.sourceUrl),
}));

export const materialIdParamsSchema = z.object({
  id: z.string().cuid('Invalid material id'),
});

export const listMaterialsQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().cuid().optional(),
  status: z.nativeEnum(MaterialStatus).optional(),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>;
