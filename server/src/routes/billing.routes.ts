import { Router } from 'express';
import { billingController } from '@/controllers/billing.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import { checkoutSchema, syncCheckoutSchema } from '@/validations/billing.schemas.js';

export const billingRouter = Router();

billingRouter.use(requireAuth);

billingRouter.get(
  '/status',
  asyncHandler((req, res) => billingController.status(req, res)),
);

billingRouter.post(
  '/checkout',
  validate(checkoutSchema),
  asyncHandler((req, res) => billingController.checkout(req, res)),
);

billingRouter.post(
  '/portal',
  asyncHandler((req, res) => billingController.portal(req, res)),
);

billingRouter.post(
  '/sync',
  validate(syncCheckoutSchema),
  asyncHandler((req, res) => billingController.sync(req, res)),
);
