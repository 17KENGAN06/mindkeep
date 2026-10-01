import type { Request, Response } from 'express';
import { resolveAppLocale } from '@/services/emailCopy.js';
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

function requestLocale(req: Request): string {
  const fromQuery = typeof req.query.locale === 'string' ? req.query.locale : null;
  return resolveAppLocale(req.get('X-App-Language') ?? fromQuery);
}

export class ReviewController {
  async listApproved(req: Request, res: Response): Promise<void> {
    res.json({ reviews: await reviewService.listApproved(requestLocale(req)) });
  }

  async eligibility(req: Request, res: Response): Promise<void> {
    res.json({ eligibility: await reviewService.eligibility(requireUserId(req)) });
  }

  async submit(req: Request, res: Response): Promise<void> {
    const review = await reviewService.submit(
      requireUserId(req),
      req.body as SubmitReviewInput,
      requestLocale(req),
    );
    res.status(201).json({ review });
  }
}

export const reviewController = new ReviewController();
