import { z } from 'zod';
import { CONTACT_TOPICS } from '@/config/contact.js';

export const sendContactSchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.email('Invalid email').max(200),
  message: z
    .string()
    .max(5000)
    .refine((value) => value.trim().length >= 10, 'Message is too short'),
  botToken: z.string().min(20).max(500).optional(),
  website: z.string().max(200).optional(),
});

export type SendContactInput = z.infer<typeof sendContactSchema>;
