import { z } from 'zod';
import { CONTACT_TOPICS, type ContactTopic } from '@/config/contact';

export function createContactFormSchema(t: (key: string) => string) {
  return z.object({
    topic: z
      .string()
      .refine((value) => CONTACT_TOPICS.includes(value as ContactTopic), {
        message: t('contact.errors.topicRequired'),
      }),
    name: z.string().trim().min(1, t('contact.errors.nameRequired')).max(120, t('contact.errors.nameMax')),
    email: z.email(t('contact.errors.email')).max(200),
    message: z
      .string()
      .max(5000, t('contact.errors.messageMax'))
      .refine((value) => value.trim().length >= 10, t('contact.errors.messageMin')),
    website: z.string().max(200).optional(),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;
