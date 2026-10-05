import { z } from 'zod';

export const checkoutSchema = z.object({
  interval: z.enum(['month', 'year']),
  plan: z.enum(['plus', 'pro']).default('pro'),
});

export const syncCheckoutSchema = z.object({
  sessionId: z.string().trim().min(1).max(256),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SyncCheckoutInput = z.infer<typeof syncCheckoutSchema>;
