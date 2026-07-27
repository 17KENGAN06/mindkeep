import { Router } from 'express';
import { statisticsController } from '@/controllers/statistics.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';

export const statisticsRouter = Router();

statisticsRouter.use(requireAuth);

statisticsRouter.get(
  '/dashboard',
  asyncHandler((req, res) => statisticsController.dashboard(req, res)),
);

statisticsRouter.get(
  '/activity',
  asyncHandler((req, res) => statisticsController.activity(req, res)),
);

statisticsRouter.get(
  '/overview',
  asyncHandler((req, res) => statisticsController.overview(req, res)),
);
