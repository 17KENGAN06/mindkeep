import { Router } from 'express';
import { authController } from '@/controllers/auth.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import {
  challengeRateLimit,
  deleteAccountRateLimit,
  emailTokenRateLimit,
  forgotPasswordRateLimit,
  googleAuthRateLimit,
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
} from '@/middleware/authRateLimit.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  googleFinishSchema,
  googleLoginSchema,
  appleLoginSchema,
  googleLinkSchema,
  googleMobileStartSchema,
  loginCodeSchema,
  loginSchema,
  onboardingSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  sessionIdParamsSchema,
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

authRouter.post(
  '/login/code',
  emailTokenRateLimit,
  validate(loginCodeSchema),
  asyncHandler((req, res) => authController.confirmLogin(req, res)),
);

authRouter.get(
  '/google/start',
  googleAuthRateLimit,
  asyncHandler((req, res) => authController.googleStart(req, res)),
);

authRouter.post(
  '/google/mobile-start',
  googleAuthRateLimit,
  validate(googleMobileStartSchema),
  asyncHandler((req, res) => authController.googleMobileStart(req, res)),
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

authRouter.post(
  '/refresh',
  refreshRateLimit,
  validate(refreshSchema),
  asyncHandler((req, res) => authController.refresh(req, res)),
);

authRouter.get(
  '/sessions',
  requireAuth,
  asyncHandler((req, res) => authController.listSessions(req, res)),
);

authRouter.delete(
  '/sessions/:id',
  requireAuth,
  validate(sessionIdParamsSchema, 'params'),
  asyncHandler((req, res) => authController.revokeSession(req, res)),
);

authRouter.get('/me', requireAuth, asyncHandler((req, res) => authController.me(req, res)));

authRouter.patch(
  '/me',
  requireAuth,
  validate(updateMeSchema),
  asyncHandler((req, res) => authController.updateMe(req, res)),
);

authRouter.post(
  '/onboarding',
  requireAuth,
  validate(onboardingSchema),
  asyncHandler((req, res) => authController.completeOnboarding(req, res)),
);

authRouter.post(
  '/apple',
  googleAuthRateLimit,
  validate(appleLoginSchema),
  asyncHandler((req, res) => authController.appleLogin(req, res)),
);

authRouter.post(
  '/google/link',
  requireAuth,
  googleAuthRateLimit,
  validate(googleLinkSchema),
  asyncHandler((req, res) => authController.linkGoogle(req, res)),
);

authRouter.post(
  '/google/unlink',
  requireAuth,
  asyncHandler((req, res) => authController.unlinkGoogle(req, res)),
);

authRouter.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler((req, res) => authController.changePassword(req, res)),
);

authRouter.post(
  '/delete-account',
  requireAuth,
  deleteAccountRateLimit,
  validate(deleteAccountSchema),
  asyncHandler((req, res) => authController.deleteAccount(req, res)),
);
