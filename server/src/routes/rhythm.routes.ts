import { Router } from 'express';
import { rhythmController } from '@/controllers/rhythm.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createHabitSchema,
  habitIdParamsSchema,
  rhythmPeriodQuerySchema,
  updateHabitSchema,
  upsertHabitCheckSchema,
} from '@/validations/rhythm.schemas.js';

export const rhythmRouter = Router();

rhythmRouter.use(requireAuth);

rhythmRouter.get(
  '/',
  validate(rhythmPeriodQuerySchema, 'query'),
  asyncHandler((req, res) => rhythmController.listPeriod(req, res)),
);

rhythmRouter.post(
  '/habits',
  validate(createHabitSchema),
  asyncHandler((req, res) => rhythmController.createHabit(req, res)),
);

rhythmRouter.patch(
  '/habits/:id',
  validate(habitIdParamsSchema, 'params'),
  validate(updateHabitSchema),
  asyncHandler((req, res) => rhythmController.updateHabit(req, res)),
);

rhythmRouter.delete(
  '/habits/:id',
  validate(habitIdParamsSchema, 'params'),
  asyncHandler((req, res) => rhythmController.removeHabit(req, res)),
);

rhythmRouter.put(
  '/checks',
  validate(upsertHabitCheckSchema),
  asyncHandler((req, res) => rhythmController.upsertCheck(req, res)),
);
