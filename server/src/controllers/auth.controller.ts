import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, getAuthCookieClearOptions } from '@/config/cookies.js';
import { env } from '@/config/env.js';
import { assertBotProtection, createBotChallenge } from '@/services/botProtection.service.js';
import { authService } from '@/services/auth.service.js';
import {
  listAuthSessions,
  revokeAuthSession,
  revokeAuthSessionByRefresh,
  revokeOwnedAuthSession,
  rotateNativeRefresh,
} from '@/services/session.service.js';
import { authSessionIssueFrom, sendAuthSession } from '@/utils/authSession.js';
import {
  appRedirectWithCode,
  buildGoogleAuthorizeUrl,
  createGoogleMobileFlow,
  decodeGoogleOAuthState,
  googleAppUpdateRequired,
  googleCallbackPageHtml,
  issueGoogleSignInTicket,
} from '@/services/googleOAuth.service.js';
import { recordAdminAudit } from '@/services/audit.service.js';
import { AppError } from '@/utils/AppError.js';
import { getAccessTokenFromRequest } from '@/utils/accessToken.js';
import { verifyAccessToken } from '@/utils/jwt.js';
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
  GoogleFinishInput,
  AppleLoginInput,
  GoogleLinkInput,
  GoogleLoginInput,
  GoogleMobileStartInput,
  LoginCodeInput,
  LoginInput,
  OnboardingInput,
  RegisterInput,
  RefreshInput,
  ResetPasswordInput,
  SessionIdParams,
  UpdateMeInput,
  VerifyEmailInput,
} from '@/validations/auth.schemas.js';

export class AuthController {
  async challenge(_req: Request, res: Response): Promise<void> {
    // One-time token: never let an HTTP cache hand out an old one.
    res.setHeader('Cache-Control', 'no-store');
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
    try {
      await authService.login(input);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ pending: true });
    } catch (error) {
      if (error instanceof AppError && error.code === 'INVALID_CREDENTIALS') {
        await recordAdminAudit({ action: 'LOGIN_FAILURE' });
      }
      throw error;
    }
  }

  async confirmLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as LoginCodeInput;
    const issue = authSessionIssueFrom(req);
    const { user, token, refreshToken } = await authService.confirmLogin(input, issue);
    await recordAdminAudit({ action: 'LOGIN_SUCCESS', actorUserId: user.id });
    sendAuthSession(req, res, 200, user, token, refreshToken);
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as GoogleLoginInput;
    const issue = authSessionIssueFrom(req);
    const { user, token, refreshToken } = await authService.googleLogin(input, issue);
    await recordAdminAudit({ action: 'GOOGLE_LOGIN', actorUserId: user.id });
    sendAuthSession(req, res, 200, user, token, refreshToken);
  }

  /** Legacy browser start without a flow secret. Kept for local development only. */
  async googleStart(req: Request, res: Response): Promise<void> {
    if (env.NODE_ENV === 'production') {
      throw googleAppUpdateRequired();
    }
    const returnUrl = typeof req.query.returnUrl === 'string' ? req.query.returnUrl : '';
    const authorizeUrl = buildGoogleAuthorizeUrl(req, returnUrl);
    res.redirect(302, authorizeUrl);
  }

  async googleMobileStart(req: Request, res: Response): Promise<void> {
    const { returnUrl } = req.body as GoogleMobileStartInput;
    const flow = createGoogleMobileFlow(req, returnUrl);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(flow);
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
    const code = await issueGoogleSignInTicket(credential, parsed.ch);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      redirect: appRedirectWithCode(parsed.returnUrl, code),
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = getAccessTokenFromRequest(req);
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        await revokeAuthSession(payload.jti, payload.sub);
      } catch {
        // Cookie/Bearer may already be dead; still clear the browser cookie below.
      }
    }

    const body = req.body as { refreshToken?: unknown } | undefined;
    const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
    if (refreshToken) {
      await revokeAuthSessionByRefresh(refreshToken);
    }

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

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await authService.completeOnboarding(req.user.id, req.body as OnboardingInput);
    res.status(200).json({ user });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const issue = authSessionIssueFrom(req);
    const { user, token, refreshToken } = await authService.verifyEmail(
      req.body as VerifyEmailInput,
      issue,
    );
    sendAuthSession(req, res, 200, user, token, refreshToken);
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = req.body as ForgotPasswordInput;
    assertBotProtection(input);
    await authService.forgotPassword(input);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ sent: true });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const issue = authSessionIssueFrom(req);
    const { user, token, refreshToken } = await authService.resetPassword(
      req.body as ResetPasswordInput,
      issue,
    );
    await recordAdminAudit({ action: 'PASSWORD_RESET', actorUserId: user.id });
    sendAuthSession(req, res, 200, user, token, refreshToken);
  }

  async appleLogin(req: Request, res: Response): Promise<void> {
    const input = req.body as AppleLoginInput;
    const issue = authSessionIssueFrom(req);
    const { user, token, refreshToken } = await authService.appleLogin(input, issue);
    sendAuthSession(req, res, 200, user, token, refreshToken);
  }

  async linkGoogle(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const user = await authService.linkGoogle(req.user.id, req.body as GoogleLinkInput);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ user });
  }

  async unlinkGoogle(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const user = await authService.unlinkGoogle(req.user.id);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ user });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const user = await authService.changePassword(
      req.user.id,
      req.body as ChangePasswordInput,
      req.authSessionId,
    );
    await recordAdminAudit({ action: 'PASSWORD_CHANGED', actorUserId: user.id });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ user });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshInput;
    const rotated = await rotateNativeRefresh(refreshToken);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(rotated);
  }

  async listSessions(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const sessions = await listAuthSessions(req.user.id, req.authSessionId);
    res.status(200).json({ sessions });
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const { id } = req.params as SessionIdParams;
    await revokeOwnedAuthSession(req.user.id, id);
    res.status(200).json({ success: true });
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Authentication required', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    await authService.deleteAccount(req.user.id, req.body as DeleteAccountInput);
    res.clearCookie(ACCESS_TOKEN_COOKIE, getAuthCookieClearOptions());
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ deleted: true });
  }
}

export const authController = new AuthController();
