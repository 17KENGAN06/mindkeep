import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, getAuthCookieClearOptions } from '@/config/cookies.js';
import { assertBotProtection, createBotChallenge } from '@/services/botProtection.service.js';
import { authService } from '@/services/auth.service.js';
import { sendAuthSession } from '@/utils/authSession.js';
import {
  appRedirectWithCode,
  buildGoogleAuthorizeUrl,
  decodeGoogleOAuthState,
  googleCallbackPageHtml,
  issueGoogleSignInTicket,
} from '@/services/googleOAuth.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  GoogleFinishInput,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateMeInput,
  VerifyEmailInput,
} from '@/validations/auth.schemas.js';

export class AuthController {
  async challenge(_req: Request, res: Response): Promise<void> {
    res.status(200).json(createBotChallenge());
  }

  async register(req: Request, res: Response): Promise<void> {
    const input = req.body as RegisterInput;
    assertBotProtection(input);
    await authService.register(input);
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ pending: true });
  }

  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    assertBotProtection(input);
    const { user, token } = await authService.login(input);
    sendAuthSession(req, res, 200, user, token);
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as GoogleLoginInput;
    const { user, token } = await authService.googleLogin(input);
    sendAuthSession(req, res, 200, user, token);
  }

  async googleStart(req: Request, res: Response): Promise<void> {
    const returnUrl = typeof req.query.returnUrl === 'string' ? req.query.returnUrl : '';
    const authorizeUrl = buildGoogleAuthorizeUrl(req, returnUrl);
    res.redirect(302, authorizeUrl);
  }

  googleCallback(_req: Request, res: Response): void {
    res
      .status(200)
      .set(
        'Content-Security-Policy',
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
      )
      .type('html')
      .send(googleCallbackPageHtml());
  }

  async googleFinish(req: Request, res: Response): Promise<void> {
    const { credential, state } = req.body as GoogleFinishInput;
    const parsed = decodeGoogleOAuthState(state);
    const code = await issueGoogleSignInTicket(credential);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      redirect: appRedirectWithCode(parsed.returnUrl, code),
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(ACCESS_TOKEN_COOKIE, getAuthCookieClearOptions());
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ success: true });
  }

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await authService.me(req.user.id);
    res.status(200).json({ user });
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await authService.updateMe(req.user.id, req.body as UpdateMeInput);
    res.status(200).json({ user });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { user, token } = await authService.verifyEmail(req.body as VerifyEmailInput);
    sendAuthSession(req, res, 200, user, token);
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = req.body as ForgotPasswordInput;
    assertBotProtection(input);
    await authService.forgotPassword(input);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ sent: true });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { user, token } = await authService.resetPassword(req.body as ResetPasswordInput);
    sendAuthSession(req, res, 200, user, token);
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await authService.changePassword(req.user.id, req.body as ChangePasswordInput);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ user });
  }
}

export const authController = new AuthController();
