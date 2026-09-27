import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { contactController } from '@/controllers/contact.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { validate } from '@/middleware/validate.js';
import { sendContactSchema } from '@/validations/contact.schemas.js';

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? 'anonymous'),
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many messages. Please try again later.',
    },
  },
});

export const contactRouter = Router();

contactRouter.post(
  '/',
  contactRateLimit,
  validate(sendContactSchema),
  asyncHandler((req, res) => contactController.send(req, res)),
);
