import { Router } from 'express';
import { authController } from '@/controllers/auth.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { authRateLimit } from '@/middleware/authRateLimit.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  googleLoginSchema,
  loginSchema,
  registerSchema,
  updateMeSchema,
} from '@/validations/auth.schemas.js';

export const authRouter = Router();

authRouter.get(
  '/challenge',
  asyncHandler((req, res) => authController.challenge(req, res)),
);

authRouter.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  asyncHandler((req, res) => authController.register(req, res)),
);

authRouter.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res)),
);

authRouter.get(
  '/google/start',
  authRateLimit,
  asyncHandler((req, res) => authController.googleStart(req, res)),
);

authRouter.get('/google/callback', (req, res) => {
  authController.googleCallback(req, res);
});

authRouter.get(
  '/google/finish',
  authRateLimit,
  asyncHandler((req, res) => authController.googleFinish(req, res)),
);

authRouter.post(
  '/google',
  authRateLimit,
  validate(googleLoginSchema),
  asyncHandler((req, res) => authController.googleLogin(req, res)),
);

authRouter.post('/logout', asyncHandler((req, res) => authController.logout(req, res)));

authRouter.get('/me', requireAuth, asyncHandler((req, res) => authController.me(req, res)));

authRouter.patch(
  '/me',
  requireAuth,
  validate(updateMeSchema),
  asyncHandler((req, res) => authController.updateMe(req, res)),
);
