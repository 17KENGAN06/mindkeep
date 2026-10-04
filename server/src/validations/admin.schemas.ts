import { z } from 'zod';

export const adminUserIdSchema = z.object({
  id: z.string().cuid(),
});

export const setBetaTesterSchema = z.object({
  betaTester: z.boolean(),
});

export type SetBetaTesterInput = z.infer<typeof setBetaTesterSchema>;
