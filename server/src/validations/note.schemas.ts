import { z } from 'zod';

const MAX_TITLE = 200;
const MAX_CONTENT = 50000;
const MAX_URL = 2000;

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const optionalSourceUrl = z
  .union([z.string().max(MAX_URL), z.literal(''), z.null()])
  .optional()
  .refine((value) => {
    if (value == null || value === '') return true;
    return isHttpUrl(value.trim());
  }, 'Enter a valid http or https URL');

export const createNoteSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(MAX_TITLE),
    content: z
      .string()
      .max(MAX_CONTENT)
      .refine((value) => value.trim().length > 0, 'Note is required'),
    sourceUrl: optionalSourceUrl,
  })
  .transform((data) => ({
    title: data.title,
    content: data.content.replace(/^\uFEFF/, ''),
    sourceUrl: emptyToNull(data.sourceUrl) ?? null,
  }));

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE).optional(),
    content: z
      .string()
      .max(MAX_CONTENT)
      .refine((value) => value.trim().length > 0, 'Note is required')
      .optional(),
    sourceUrl: optionalSourceUrl,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })
  .transform((data) => ({
    ...data,
    sourceUrl: emptyToNull(data.sourceUrl),
  }));

export const noteIdParamsSchema = z.object({
  id: z.string().cuid('Invalid note id'),
});

export const listNotesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
