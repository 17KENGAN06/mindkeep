import type { Request, Response } from 'express';
import { reviewService } from '@/services/review.service.js';
import type { SubmitReviewInput } from '@/validations/review.schemas.js';
import { AppError } from '@/utils/AppError.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class ReviewController {
  async listApproved(_req: Request, res: Response): Promise<void> {
    res.json({ reviews: await reviewService.listApproved() });
  }

  async eligibility(req: Request, res: Response): Promise<void> {
    res.json({ eligibility: await reviewService.eligibility(requireUserId(req)) });
  }

  async submit(req: Request, res: Response): Promise<void> {
    const review = await reviewService.submit(
      requireUserId(req),
      req.body as SubmitReviewInput,
    );
    res.status(201).json({ review });
  }
}

export const reviewController = new ReviewController();
