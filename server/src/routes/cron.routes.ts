import { Router } from 'express';
import { cronController } from '@/controllers/cron.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireCronSecret } from '@/middleware/cronAuth.js';
import { cronRateLimit } from '@/middleware/cronRateLimit.js';

export const cronRouter = Router();

cronRouter.post(
  '/reminders',
  cronRateLimit,
  requireCronSecret,
  asyncHandler((req, res) => cronController.runReminders(req, res)),
);
