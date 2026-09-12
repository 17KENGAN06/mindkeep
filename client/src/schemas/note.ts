import { z } from 'zod';
import { isHttpUrl } from '@/utils/url';

export function createNoteFormSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().trim().min(1, t('notes.errors.titleRequired')).max(200, t('notes.errors.titleMax')),
    content: z
      .string()
      .max(50000, t('notes.errors.contentMax'))
      .refine((value) => value.trim().length > 0, t('notes.errors.contentRequired')),
    sourceUrl: z
      .string()
      .max(2000)
      .refine((value) => !value.trim() || isHttpUrl(value.trim()), {
        message: t('notes.errors.url'),
      }),
  });
}

export type NoteFormValues = z.infer<ReturnType<typeof createNoteFormSchema>>;
