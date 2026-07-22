import { Router } from 'express';
import { adminController } from '@/controllers/admin.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '@/middleware/auth.middleware.js';

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
