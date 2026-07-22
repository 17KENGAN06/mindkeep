import { Router } from 'express';
import { reviewController } from '@/controllers/review.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import { submitReviewSchema } from '@/validations/review.schemas.js';

export const reviewRouter = Router();

reviewRouter.get(
  '/',
  asyncHandler((req, res) => reviewController.listApproved(req, res)),
);

reviewRouter.get(
  '/eligibility',
  requireAuth,
  asyncHandler((req, res) => reviewController.eligibility(req, res)),
);

reviewRouter.post(
  '/',
  requireAuth,
  validate(submitReviewSchema),
  asyncHandler((req, res) => reviewController.submit(req, res)),
);
