import { UserReviewStatus } from '@prisma/client';
import { z } from 'zod';

export const adminReviewIdSchema = z.object({
  id: z.string().cuid(),
});

export const moderateReviewSchema = z.object({
  status: z.enum([UserReviewStatus.APPROVED, UserReviewStatus.REJECTED]),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
