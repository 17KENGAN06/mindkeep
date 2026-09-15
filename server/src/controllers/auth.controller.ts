import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, getAuthCookieOptions } from '@/config/cookies.js';
import { assertBotProtection, createBotChallenge } from '@/services/botProtection.service.js';
import { authService } from '@/services/auth.service.js';
import {
  appRedirectWithCredential,
  buildGoogleAuthorizeUrl,
  decodeGoogleOAuthState,
  googleCallbackPageHtml,
} from '@/services/googleOAuth.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  UpdateMeInput,
} from '@/validations/auth.schemas.js';

export class AuthController {
  async challenge(_req: Request, res: Response): Promise<void> {
    res.status(200).json(createBotChallenge());
  }

  async register(req: Request, res: Response): Promise<void> {
    const input = req.body as RegisterInput;
    assertBotProtection(input);
    const { user, token } = await authService.register(input);

    res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(201).json({ user, token });
  }

  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    assertBotProtection(input);
    const { user, token } = await authService.login(input);

    res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(200).json({ user, token });
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as GoogleLoginInput;
    const { user, token } = await authService.googleLogin(input);

    res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(200).json({ user, token });
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
    const credential = typeof req.query.credential === 'string' ? req.query.credential : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (credential.length < 100 || !state) {
      throw new AppError('Invalid Google credential', {
        statusCode: 400,
        code: 'INVALID_GOOGLE_CREDENTIAL',
      });
    }

    const parsed = decodeGoogleOAuthState(state);
    res.status(200).json({
      redirect: appRedirectWithCredential(parsed.returnUrl, credential),
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      ...getAuthCookieOptions(),
      maxAge: undefined,
    });
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
}

export const authController = new AuthController();
