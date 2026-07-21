import { Router } from 'express';
import { categoryController } from '@/controllers/category.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@/validations/category.schemas.js';

export const categoryRouter = Router();

categoryRouter.use(requireAuth);

categoryRouter.get(
  '/',
  asyncHandler((req, res) => categoryController.list(req, res)),
);

categoryRouter.post(
  '/',
  validate(createCategorySchema),
  asyncHandler((req, res) => categoryController.create(req, res)),
);

categoryRouter.patch(
  '/:id',
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategorySchema),
  asyncHandler((req, res) => categoryController.update(req, res)),
);

categoryRouter.delete(
  '/:id',
  validate(categoryIdParamsSchema, 'params'),
  asyncHandler((req, res) => categoryController.remove(req, res)),
);
