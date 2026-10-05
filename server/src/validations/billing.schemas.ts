import { z } from 'zod';

export const checkoutSchema = z.object({
  interval: z.enum(['month', 'year']),
  plan: z.enum(['plus', 'pro']).default('pro'),
});

export const changePlanSchema = z.object({
  interval: z.enum(['month', 'year']),
  plan: z.enum(['plus', 'pro']),
});

export const syncCheckoutSchema = z.object({
  sessionId: z.string().trim().min(1).max(256),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type SyncCheckoutInput = z.infer<typeof syncCheckoutSchema>;
