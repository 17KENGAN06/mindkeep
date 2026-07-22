import { z } from 'zod';

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(20).max(1000),
  location: z.string().trim().max(120).optional().default(''),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
