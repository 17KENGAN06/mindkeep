import { Router } from 'express';
import { authController } from '@/controllers/auth.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import {
  challengeRateLimit,
  emailTokenRateLimit,
  forgotPasswordRateLimit,
  googleAuthRateLimit,
  loginRateLimit,
  registerRateLimit,
} from '@/middleware/authRateLimit.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleFinishSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
  verifyEmailSchema,
} from '@/validations/auth.schemas.js';

export const authRouter = Router();

authRouter.get(
  '/challenge',
  challengeRateLimit,
  asyncHandler((req, res) => authController.challenge(req, res)),
);

authRouter.post(
  '/register',
  registerRateLimit,
  validate(registerSchema),
  asyncHandler((req, res) => authController.register(req, res)),
);

authRouter.post(
  '/login',
  loginRateLimit,
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res)),
);

authRouter.get(
  '/google/start',
  googleAuthRateLimit,
  asyncHandler((req, res) => authController.googleStart(req, res)),
);

authRouter.get('/google/callback', (req, res) => {
  authController.googleCallback(req, res);
});

authRouter.post(
  '/google/finish',
  googleAuthRateLimit,
  validate(googleFinishSchema),
  asyncHandler((req, res) => authController.googleFinish(req, res)),
);

authRouter.post(
  '/google',
  googleAuthRateLimit,
  validate(googleLoginSchema),
  asyncHandler((req, res) => authController.googleLogin(req, res)),
);

authRouter.post(
  '/verify-email',
  emailTokenRateLimit,
  validate(verifyEmailSchema),
  asyncHandler((req, res) => authController.verifyEmail(req, res)),
);

authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler((req, res) => authController.forgotPassword(req, res)),
);

authRouter.post(
  '/reset-password',
  emailTokenRateLimit,
  validate(resetPasswordSchema),
  asyncHandler((req, res) => authController.resetPassword(req, res)),
);

authRouter.post('/logout', asyncHandler((req, res) => authController.logout(req, res)));

authRouter.get('/me', requireAuth, asyncHandler((req, res) => authController.me(req, res)));

authRouter.patch(
  '/me',
  requireAuth,
  validate(updateMeSchema),
  asyncHandler((req, res) => authController.updateMe(req, res)),
);

authRouter.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler((req, res) => authController.changePassword(req, res)),
);
