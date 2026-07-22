import { Router } from 'express';
import { adminController } from '@/controllers/admin.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  adminReviewIdSchema,
  moderateReviewSchema,
} from '@/validations/admin.schemas.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  '/overview',
  asyncHandler((req, res) => adminController.overview(req, res)),
);

adminRouter.get(
  '/users',
  asyncHandler((req, res) => adminController.listUsers(req, res)),
);

adminRouter.get(
  '/reviews',
  asyncHandler((req, res) => adminController.listReviews(req, res)),
);

adminRouter.patch(
  '/reviews/:id',
  validate(adminReviewIdSchema, 'params'),
  validate(moderateReviewSchema),
  asyncHandler((req, res) => adminController.moderateReview(req, res)),
);
