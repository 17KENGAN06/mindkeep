import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, getAuthCookieOptions } from '@/config/cookies.js';
import { assertBotProtection, createBotChallenge } from '@/services/botProtection.service.js';
import { authService } from '@/services/auth.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
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
    res.status(201).json({ user });
  }

  async login(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginInput;
    assertBotProtection(input);
    const { user, token } = await authService.login(input);

    res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(200).json({ user });
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as GoogleLoginInput;
    const { user, token } = await authService.googleLogin(input);

    res.cookie(ACCESS_TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(200).json({ user });
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
}

export const authController = new AuthController();
