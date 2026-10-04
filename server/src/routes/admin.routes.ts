import { Router } from 'express';
import { adminController } from '@/controllers/admin.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import { adminUserIdSchema, setBetaTesterSchema } from '@/validations/admin.schemas.js';

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

adminRouter.get(
  '/subscribers',
  asyncHandler((req, res) => adminController.listSubscribers(req, res)),
);

adminRouter.get(
  '/beta-testers',
  asyncHandler((req, res) => adminController.listBetaTesters(req, res)),
);

adminRouter.patch(
  '/users/:id/beta',
  validate(adminUserIdSchema, 'params'),
  validate(setBetaTesterSchema),
  asyncHandler((req, res) => adminController.setBetaTester(req, res)),
);

adminRouter.get(
  '/users/:id',
  validate(adminUserIdSchema, 'params'),
  asyncHandler((req, res) => adminController.getUserActivity(req, res)),
);

adminRouter.get(
  '/audit',
  asyncHandler((req, res) => adminController.listAudit(req, res)),
);
