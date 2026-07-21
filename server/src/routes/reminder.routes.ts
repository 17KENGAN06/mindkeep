import { Router } from 'express';
import { reminderController } from '@/controllers/reminder.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  calendarQuerySchema,
  listRemindersQuerySchema,
  reminderIdParamsSchema,
} from '@/validations/reminder.schemas.js';

export const reminderRouter = Router();

reminderRouter.use(requireAuth);

reminderRouter.get(
  '/',
  validate(listRemindersQuerySchema, 'query'),
  asyncHandler((req, res) => reminderController.list(req, res)),
);

reminderRouter.get(
  '/today',
  asyncHandler((req, res) => reminderController.today(req, res)),
);

reminderRouter.get(
  '/upcoming',
  asyncHandler((req, res) => reminderController.upcoming(req, res)),
);

reminderRouter.get(
  '/overdue',
  asyncHandler((req, res) => reminderController.overdue(req, res)),
);

reminderRouter.get(
  '/calendar',
  validate(calendarQuerySchema, 'query'),
  asyncHandler((req, res) => reminderController.calendar(req, res)),
);

reminderRouter.post(
  '/:id/complete',
  validate(reminderIdParamsSchema, 'params'),
  asyncHandler((req, res) => reminderController.complete(req, res)),
);

reminderRouter.post(
  '/:id/skip',
  validate(reminderIdParamsSchema, 'params'),
  asyncHandler((req, res) => reminderController.skip(req, res)),
);
