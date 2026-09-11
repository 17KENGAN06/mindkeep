import { Router } from 'express';
import { dailyTaskController } from '@/controllers/dailyTask.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createDailyTaskSchema,
  dailyTaskDayQuerySchema,
  dailyTaskIdParamsSchema,
  dailyTaskPeriodQuerySchema,
  forestQuerySchema,
  updateDailyTaskSchema,
} from '@/validations/dailyTask.schemas.js';

export const dailyTaskRouter = Router();

dailyTaskRouter.use(requireAuth);

dailyTaskRouter.get(
  '/',
  validate(dailyTaskPeriodQuerySchema, 'query'),
  asyncHandler((req, res) => dailyTaskController.listPeriod(req, res)),
);

dailyTaskRouter.get(
  '/day',
  validate(dailyTaskDayQuerySchema, 'query'),
  asyncHandler((req, res) => dailyTaskController.listDay(req, res)),
);

dailyTaskRouter.get(
  '/forest',
  validate(forestQuerySchema, 'query'),
  asyncHandler((req, res) => dailyTaskController.forest(req, res)),
);

dailyTaskRouter.post(
  '/',
  validate(createDailyTaskSchema),
  asyncHandler((req, res) => dailyTaskController.create(req, res)),
);

dailyTaskRouter.patch(
  '/:id',
  validate(dailyTaskIdParamsSchema, 'params'),
  validate(updateDailyTaskSchema),
  asyncHandler((req, res) => dailyTaskController.update(req, res)),
);

dailyTaskRouter.delete(
  '/:id',
  validate(dailyTaskIdParamsSchema, 'params'),
  asyncHandler((req, res) => dailyTaskController.remove(req, res)),
);
