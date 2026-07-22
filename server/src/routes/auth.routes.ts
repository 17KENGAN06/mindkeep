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
} from '@/validations/auth.schemas.js';

export const authRouter = Router();

authRouter.get(
  '/challenge',
  authRateLimit,
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

authRouter.post(
  '/google',
  authRateLimit,
  validate(googleLoginSchema),
  asyncHandler((req, res) => authController.googleLogin(req, res)),
);

authRouter.post('/logout', asyncHandler((req, res) => authController.logout(req, res)));

authRouter.get('/me', requireAuth, asyncHandler((req, res) => authController.me(req, res)));
