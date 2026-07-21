import { Router } from 'express';
import { materialController } from '@/controllers/material.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createMaterialSchema,
  listMaterialsQuerySchema,
  materialIdParamsSchema,
  updateMaterialSchema,
} from '@/validations/material.schemas.js';

export const materialRouter = Router();

materialRouter.use(requireAuth);

materialRouter.get(
  '/',
  validate(listMaterialsQuerySchema, 'query'),
  asyncHandler((req, res) => materialController.list(req, res)),
);

materialRouter.get(
  '/:id',
  validate(materialIdParamsSchema, 'params'),
  asyncHandler((req, res) => materialController.getById(req, res)),
);

materialRouter.post(
  '/',
  validate(createMaterialSchema),
  asyncHandler((req, res) => materialController.create(req, res)),
);

materialRouter.patch(
  '/:id',
  validate(materialIdParamsSchema, 'params'),
  validate(updateMaterialSchema),
  asyncHandler((req, res) => materialController.update(req, res)),
);

materialRouter.delete(
  '/:id',
  validate(materialIdParamsSchema, 'params'),
  asyncHandler((req, res) => materialController.remove(req, res)),
);

materialRouter.patch(
  '/:id/archive',
  validate(materialIdParamsSchema, 'params'),
  asyncHandler((req, res) => materialController.archive(req, res)),
);
