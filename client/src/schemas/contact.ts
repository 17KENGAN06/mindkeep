import { z } from 'zod';
import { CONTACT_TOPICS, type ContactTopic } from '@/config/contact';

export function createContactFormSchema(t: (key: string) => string) {
  return z
    .object({
      topic: z
        .string()
        .refine((value) => CONTACT_TOPICS.includes(value as ContactTopic), {
          message: t('contact.errors.topicRequired'),
        }),
      name: z.string().trim().min(1, t('contact.errors.nameRequired')).max(120, t('contact.errors.nameMax')),
      email: z.email(t('contact.errors.email')).max(200),
      message: z.string().max(5000, t('contact.errors.messageMax')),
      exceptionAck: z.boolean().optional(),
      noUnusedRefundAck: z.boolean().optional(),
      website: z.string().max(200).optional(),
    })
    .superRefine((value, ctx) => {
      const length = value.message.trim().length;
      if (value.topic === 'billing') {
        if (length < 400) {
          ctx.addIssue({ code: 'custom', path: ['message'], message: t('contact.errors.billingMessageMin') });
        }
        if (value.exceptionAck !== true) {
          ctx.addIssue({ code: 'custom', path: ['exceptionAck'], message: t('contact.errors.exceptionAck') });
        }
        if (value.noUnusedRefundAck !== true) {
          ctx.addIssue({
            code: 'custom',
            path: ['noUnusedRefundAck'],
            message: t('contact.errors.noUnusedRefundAck'),
          });
        }
        return;
      }
      if (length < 10) {
        ctx.addIssue({ code: 'custom', path: ['message'], message: t('contact.errors.messageMin') });
      }
    });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;
