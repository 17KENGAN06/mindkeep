import { z } from 'zod';
import { CONTACT_TOPICS } from '@/config/contact.js';

export const sendContactSchema = z
  .object({
    topic: z.enum(CONTACT_TOPICS),
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.email('Invalid email').max(200),
    message: z.string().max(5000),
    exceptionAck: z.boolean().optional(),
    noUnusedRefundAck: z.boolean().optional(),
    botToken: z.string().min(20).max(500).optional(),
    website: z.string().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    const length = value.message.trim().length;
    if (value.topic === 'billing') {
      if (length < 400) {
        ctx.addIssue({
          code: 'custom',
          path: ['message'],
          message: 'Billing requests need a detailed explanation',
        });
      }
      if (value.exceptionAck !== true) {
        ctx.addIssue({
          code: 'custom',
          path: ['exceptionAck'],
          message: 'You must acknowledge the refund policy',
        });
      }
      if (value.noUnusedRefundAck !== true) {
        ctx.addIssue({
          code: 'custom',
          path: ['noUnusedRefundAck'],
          message: 'You must acknowledge that unused time is not refunded',
        });
      }
      return;
    }
    if (length < 10) {
      ctx.addIssue({
        code: 'custom',
        path: ['message'],
        message: 'Message is too short',
      });
    }
  });

export type SendContactInput = z.infer<typeof sendContactSchema>;
