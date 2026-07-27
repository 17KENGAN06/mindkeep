import { Router } from 'express';
import { plannerController } from '@/controllers/planner.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createTaskCategorySchema,
  createTaskSchema,
  listOccurrencesQuerySchema,
  occurrenceIdParamsSchema,
  rescheduleOccurrenceSchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '@/validations/planner.schemas.js';

export const plannerRouter = Router();

plannerRouter.use(requireAuth);

plannerRouter.get(
  '/categories',
  asyncHandler((req, res) => plannerController.listCategories(req, res)),
);
plannerRouter.post(
  '/categories',
  validate(createTaskCategorySchema),
  asyncHandler((req, res) => plannerController.createCategory(req, res)),
);
plannerRouter.delete(
  '/categories/:id',
  validate(taskIdParamsSchema, 'params'),
  asyncHandler((req, res) => plannerController.removeCategory(req, res)),
);

plannerRouter.post(
  '/tasks',
  validate(createTaskSchema),
  asyncHandler((req, res) => plannerController.createTask(req, res)),
);
plannerRouter.patch(
  '/tasks/:id',
  validate(taskIdParamsSchema, 'params'),
  validate(updateTaskSchema),
  asyncHandler((req, res) => plannerController.updateTask(req, res)),
);
plannerRouter.delete(
  '/tasks/:id',
  validate(taskIdParamsSchema, 'params'),
  asyncHandler((req, res) => plannerController.removeTask(req, res)),
);

plannerRouter.get(
  '/occurrences',
  validate(listOccurrencesQuerySchema, 'query'),
  asyncHandler((req, res) => plannerController.listOccurrences(req, res)),
);
plannerRouter.post(
  '/occurrences/:id/complete',
  validate(occurrenceIdParamsSchema, 'params'),
  asyncHandler((req, res) => plannerController.completeOccurrence(req, res)),
);
plannerRouter.post(
  '/occurrences/:id/reschedule',
  validate(occurrenceIdParamsSchema, 'params'),
  validate(rescheduleOccurrenceSchema),
  asyncHandler((req, res) => plannerController.rescheduleOccurrence(req, res)),
);
plannerRouter.delete(
  '/occurrences/:id',
  validate(occurrenceIdParamsSchema, 'params'),
  asyncHandler((req, res) => plannerController.removeOccurrence(req, res)),
);

plannerRouter.get(
  '/statistics',
  asyncHandler((req, res) => plannerController.statistics(req, res)),
);
