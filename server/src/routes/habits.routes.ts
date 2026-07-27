import { Router } from 'express';
import { habitsController } from '@/controllers/habits.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createHabitSchema,
  habitIdParamsSchema,
  toggleHabitLogSchema,
  updateHabitSchema,
} from '@/validations/habits.schemas.js';

export const habitsRouter = Router();

habitsRouter.use(requireAuth);

habitsRouter.get('/', asyncHandler((req, res) => habitsController.list(req, res)));
habitsRouter.get(
  '/statistics',
  asyncHandler((req, res) => habitsController.statistics(req, res)),
);
habitsRouter.post(
  '/',
  validate(createHabitSchema),
  asyncHandler((req, res) => habitsController.create(req, res)),
);
habitsRouter.patch(
  '/:id',
  validate(habitIdParamsSchema, 'params'),
  validate(updateHabitSchema),
  asyncHandler((req, res) => habitsController.update(req, res)),
);
habitsRouter.delete(
  '/:id',
  validate(habitIdParamsSchema, 'params'),
  asyncHandler((req, res) => habitsController.remove(req, res)),
);
habitsRouter.post(
  '/:id/toggle',
  validate(habitIdParamsSchema, 'params'),
  validate(toggleHabitLogSchema),
  asyncHandler((req, res) => habitsController.toggleLog(req, res)),
);
