import { Router } from 'express';
import { notificationController } from '@/controllers/notification.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import { notificationIdParamsSchema } from '@/validations/notification.schemas.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  '/',
  asyncHandler((req, res) => notificationController.list(req, res)),
);

notificationRouter.get(
  '/unread-count',
  asyncHandler((req, res) => notificationController.unreadCount(req, res)),
);

// Important: static path before "/:id/read"
notificationRouter.patch(
  '/read-all',
  asyncHandler((req, res) => notificationController.markAllRead(req, res)),
);

notificationRouter.patch(
  '/:id/read',
  validate(notificationIdParamsSchema, 'params'),
  asyncHandler((req, res) => notificationController.markRead(req, res)),
);
