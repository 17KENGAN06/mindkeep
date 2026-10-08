import { EmailTokenType, type PlanInterval, Prisma, UserPlan, UserRole } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { reviewLoginCodeFor } from '@/config/reviewLogin.js';
import { prisma } from '@/config/prisma.js';
import { loginCodeEmail, resetPasswordEmail, resolveAppLocale, verifyAccountEmail } from '@/services/emailCopy.js';
import { sendEmail } from '@/services/email.service.js';
import {
  consumeEmailToken,
  consumeLoginCode,
  deleteEmailTokens,
  findValidEmailToken,
  issueEmailToken,
  issueLoginCode,
} from '@/services/emailToken.service.js';
import { consumeGoogleSignInTicket } from '@/services/googleOAuth.service.js';
import {
  exchangeAppleAuthorizationCode,
  revokeAppleRefreshToken,
  verifyAppleIdentityToken,
} from '@/services/appleAuth.service.js';
import type {
  AppleLoginInput,
  GoogleLinkInput,
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginCodeInput,
  LoginInput,
  OnboardingInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateMeInput,
  VerifyEmailInput,
} from '@/validations/auth.schemas.js';
import { ALL_APP_MODULES, normalizeAppModules, type AppModule } from '@/config/appModules.js';
import { issueAuthSession, revokeAuthSessionsForUser, type AuthSessionIssue } from '@/services/session.service.js';
import { cancelStripeForDeletedUser } from '@/services/billing.service.js';
import { isProUser } from '@/services/entitlements.service.js';
import { AppError } from '@/utils/AppError.js';
import { hashPassword, verifyPassword } from '@/utils/password.js';

const userRecordSelect = {
  id: true,
  name: true,
  email: true,
  timezone: true,
  role: true,
  passwordHash: true,
  googleId: true,
  appleId: true,
  plan: true,
  planInterval: true,
  planExpiresAt: true,
  cancelAtPeriodEnd: true,
  betaTester: true,
  onboardingCompletedAt: true,
  enabledModules: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Valid bcrypt hash used only to keep login timing similar when the user is missing. */
const DUMMY_PASSWORD_HASH =
  '$2b$12$UPlsbhFvXZu6F6aMUQ9RwOuwh2IJnFxGu9jPVnUs7jQorxkSU2asq';
const googleClient = new OAuth2Client();

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: UserRole;
  hasPassword: boolean;
  /** A Google account is linked (sign in with Google works). Additive: older clients ignore it. */
  hasGoogle: boolean;
  /** Sign in with Apple is linked (iOS). Additive: older clients ignore it. */
  hasApple: boolean;
  plan: UserPlan;
  planInterval: PlanInterval | null;
  planExpiresAt: Date | null;
  cancelAtPeriodEnd: boolean;
  betaTester: boolean;
  onboardingCompleted: boolean;
  enabledModules: AppModule[];
  createdAt: Date;
  updatedAt: Date;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: UserRole;
  passwordHash: string | null;
  googleId: string | null;
  appleId: string | null;
  plan: UserPlan;
  planInterval: PlanInterval | null;
  planExpiresAt: Date | null;
  cancelAtPeriodEnd: boolean;
  betaTester: boolean;
  onboardingCompletedAt: Date | null;
  enabledModules: string[];
  createdAt: Date;
  updatedAt: Date;
};

function toPublicUser(user: UserRecord): PublicUser {
  const paid = isProUser(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    hasGoogle: Boolean(user.googleId),
    hasApple: Boolean(user.appleId),
    plan: paid
      ? user.plan === UserPlan.FREE
        ? UserPlan.PRO
        : user.plan
      : UserPlan.FREE,
    planInterval: paid ? user.planInterval : null,
    planExpiresAt: paid ? user.planExpiresAt : null,
    cancelAtPeriodEnd: paid ? user.cancelAtPeriodEnd : false,
    betaTester: user.betaTester,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    enabledModules: user.onboardingCompletedAt
      ? normalizeAppModules(user.enabledModules).length > 0
        ? normalizeAppModules(user.enabledModules)
        : [...ALL_APP_MODULES]
      : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Google identity from a web credential or a native one-time code + flow secret: verified
 * signature, audience and a verified email. Used by sign in and by linking.
 */
async function verifyGoogleIdentity(input: {
  credential?: string;
  code?: string;
  flowSecret?: string;
}): Promise<{ sub: string; email: string; name?: string }> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not configured', {
      statusCode: 503,
      code: 'GOOGLE_AUTH_UNAVAILABLE',
    });
  }

  const idToken = input.code
    ? await consumeGoogleSignInTicket(input.code, input.flowSecret)
    : input.credential;

  if (!idToken) {
    throw new AppError('Invalid Google credential', {
      statusCode: 401,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google credential', {
      statusCode: 401,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new AppError('Google account email is not verified', {
      statusCode: 401,
      code: 'INVALID_GOOGLE_CREDENTIAL',
    });
  }

  return { sub: payload.sub, email: payload.email, name: payload.name };
}

function shouldBeAdmin(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}

function isAdminUser(user: Pick<PublicUser, 'email' | 'role'>): boolean {
  return user.role === UserRole.ADMIN || shouldBeAdmin(user.email);
}

function assertMaintenanceAccess(user: Pick<PublicUser, 'email' | 'role'>): void {
  if (!env.MAINTENANCE_MODE || isAdminUser(user)) {
    return;
  }

  throw new AppError('Service is under maintenance. Admin access only.', {
    statusCode: 403,
    code: 'MAINTENANCE_ADMIN_ONLY',
  });
}

async function sessionFor(
  user: PublicUser,
  issue?: AuthSessionIssue,
): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
  const tokens = await issueAuthSession(user, issue);
  return { user, ...tokens };
}

function appLink(path: string, token: string): string {
  const url = new URL(path, `${env.CLIENT_URL}/`);
  url.searchParams.set('token', token);
  return url.toString();
}

async function ensureAdminRole(user: UserRecord): Promise<UserRecord> {
  if (!shouldBeAdmin(user.email) || user.role === UserRole.ADMIN) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
    select: userRecordSelect,
  });
}

type VerifyPayload = {
  name: string;
  passwordHash: string;
  timezone: string;
  role: UserRole;
};

export class AuthService {
  async register(input: RegisterInput): Promise<{ pending: true }> {
    const email = input.email.toLowerCase();

    if (env.MAINTENANCE_MODE && !shouldBeAdmin(email)) {
      throw new AppError('Service is under maintenance. Admin access only.', {
        statusCode: 403,
        code: 'MAINTENANCE_ADMIN_ONLY',
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new AppError('This email is already registered', {
        statusCode: 409,
        code: 'EMAIL_TAKEN',
      });
    }

    const passwordHash = await hashPassword(input.password);
    const role = shouldBeAdmin(email) ? UserRole.ADMIN : UserRole.USER;
    const payload: VerifyPayload = {
      name: input.name,
      passwordHash,
      timezone: input.timezone,
      role,
    };

    const token = await issueEmailToken({
      type: EmailTokenType.VERIFY_EMAIL,
      email,
      payload: JSON.stringify(payload),
    });

    try {
      const mail = verifyAccountEmail(
        resolveAppLocale(input.locale),
        input.name,
        appLink('/verify-email', token),
      );
      await sendEmail({
        to: email,
        subject: mail.subject,
        text: mail.text,
      });
    } catch (error) {
      await deleteEmailTokens(email, EmailTokenType.VERIFY_EMAIL);
      throw error;
    }

    return { pending: true };
  }

  async verifyEmail(
    input: VerifyEmailInput,
    issue?: AuthSessionIssue,
  ): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
    const pending = await findValidEmailToken(EmailTokenType.VERIFY_EMAIL, input.token);
    let payload: VerifyPayload;
    try {
      payload = JSON.parse(pending.payload ?? '') as VerifyPayload;
    } catch {
      await prisma.emailToken.delete({ where: { id: pending.id } }).catch(() => undefined);
      throw new AppError('This link is invalid or has expired', {
        statusCode: 400,
        code: 'INVALID_EMAIL_TOKEN',
      });
    }

    if (!payload?.name || !payload.passwordHash || !payload.timezone || !payload.role) {
      await prisma.emailToken.delete({ where: { id: pending.id } }).catch(() => undefined);
      throw new AppError('This link is invalid or has expired', {
        statusCode: 400,
        code: 'INVALID_EMAIL_TOKEN',
      });
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: payload.name,
          email: pending.email,
          passwordHash: payload.passwordHash,
          timezone: payload.timezone,
          role: payload.role,
          emailVerified: true,
          onboardingCompletedAt: null,
          enabledModules: [],
        },
        select: userRecordSelect,
      });
      await prisma.emailToken.delete({ where: { id: pending.id } }).catch(() => undefined);

      const withRole = await ensureAdminRole(user);
      assertMaintenanceAccess(toPublicUser(withRole));
      return sessionFor(toPublicUser(withRole), issue);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        await prisma.emailToken.delete({ where: { id: pending.id } }).catch(() => undefined);
        throw new AppError('This email is already registered', {
          statusCode: 409,
          code: 'EMAIL_TAKEN',
        });
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<{ pending: true }> {
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: userRecordSelect,
    });

    const isValid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !user.passwordHash || !isValid) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const withRole = await ensureAdminRole(user);
    const publicUser = toPublicUser(withRole);
    assertMaintenanceAccess(publicUser);

    // Store review account: fixed code, no email (never for admins).
    const reviewCode = withRole.role === UserRole.ADMIN ? null : reviewLoginCodeFor(email);
    if (reviewCode) {
      await issueLoginCode(email, reviewCode);
      logger.info('Review login code issued', { userId: user.id });
      return { pending: true };
    }

    const code = await issueLoginCode(email);
    try {
      const mail = loginCodeEmail(resolveAppLocale(input.locale), user.name, code);
      await sendEmail({
        to: email,
        subject: mail.subject,
        text: mail.text,
      });
    } catch (error) {
      await deleteEmailTokens(email, EmailTokenType.LOGIN_CODE);
      throw error;
    }

    return { pending: true };
  }

  async confirmLogin(
    input: LoginCodeInput,
    issue?: AuthSessionIssue,
  ): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
    const email = input.email.toLowerCase();
    await consumeLoginCode(email, input.code);

    const user = await prisma.user.findUnique({
      where: { email },
      select: userRecordSelect,
    });

    if (!user?.passwordHash) {
      throw new AppError('That code is incorrect or has expired', {
        statusCode: 400,
        code: 'INVALID_LOGIN_CODE',
      });
    }

    const withRole = await ensureAdminRole(user);
    const publicUser = toPublicUser(withRole);
    assertMaintenanceAccess(publicUser);
    return sessionFor(publicUser, issue);
  }

  async googleLogin(
    input: GoogleLoginInput,
    issue?: AuthSessionIssue,
  ): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google sign-in is not configured', {
        statusCode: 503,
        code: 'GOOGLE_AUTH_UNAVAILABLE',
      });
    }

    const payload = await verifyGoogleIdentity(input);

    const email = payload.email.toLowerCase();
    const name = payload.name?.trim().slice(0, 100) || email.split('@')[0] || 'Mindkeep user';

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
      select: userRecordSelect,
    });

    if (!user) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new AppError('This email already has an account. Sign in with your password.', {
          statusCode: 409,
          code: 'GOOGLE_EMAIL_IN_USE',
        });
      }

      if (env.MAINTENANCE_MODE && !shouldBeAdmin(email)) {
        throw new AppError('Service is under maintenance. Admin access only.', {
          statusCode: 403,
          code: 'MAINTENANCE_ADMIN_ONLY',
        });
      }

      await deleteEmailTokens(email, EmailTokenType.VERIFY_EMAIL);

      const role = shouldBeAdmin(email) ? UserRole.ADMIN : UserRole.USER;
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId: payload.sub,
          timezone: input.timezone,
          role,
          emailVerified: true,
          onboardingCompletedAt: null,
          enabledModules: [],
        },
        select: userRecordSelect,
      });
    }

    const withRole = await ensureAdminRole(user);
    const publicUser = toPublicUser(withRole);
    assertMaintenanceAccess(publicUser);
    return sessionFor(publicUser, issue);
  }

  /**
   * Sign in with Apple (iOS). Same account rules as Google: an existing email is never linked
   * automatically. The refresh token is kept only to revoke access when the account is deleted.
   */
  async appleLogin(
    input: AppleLoginInput,
    issue?: AuthSessionIssue,
  ): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
    const identity = await verifyAppleIdentityToken(input.identityToken);

    let user = await prisma.user.findUnique({
      where: { appleId: identity.sub },
      select: { ...userRecordSelect, appleRefreshToken: true },
    });

    if (user && !user.appleRefreshToken && input.authorizationCode) {
      const refresh = await exchangeAppleAuthorizationCode(input.authorizationCode);
      if (refresh) {
        await prisma.user.update({ where: { id: user.id }, data: { appleRefreshToken: refresh } });
      }
    }

    if (!user) {
      const email = identity.email;
      if (!email) {
        throw new AppError('Apple did not share an email. Try again or use another sign-in method.', {
          statusCode: 400,
          code: 'APPLE_EMAIL_MISSING',
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existingUser) {
        throw new AppError('This email already has an account. Sign in with your password.', {
          statusCode: 409,
          code: 'APPLE_EMAIL_IN_USE',
        });
      }

      if (env.MAINTENANCE_MODE && !shouldBeAdmin(email)) {
        throw new AppError('Service is under maintenance. Admin access only.', {
          statusCode: 403,
          code: 'MAINTENANCE_ADMIN_ONLY',
        });
      }

      await deleteEmailTokens(email, EmailTokenType.VERIFY_EMAIL);
      const refresh = input.authorizationCode
        ? await exchangeAppleAuthorizationCode(input.authorizationCode)
        : null;
      const name = input.fullName?.trim().slice(0, 100) || email.split('@')[0] || 'Mindkeep user';
      user = await prisma.user.create({
        data: {
          name,
          email,
          appleId: identity.sub,
          appleRefreshToken: refresh,
          timezone: input.timezone,
          role: shouldBeAdmin(email) ? UserRole.ADMIN : UserRole.USER,
          emailVerified: true,
          onboardingCompletedAt: null,
          enabledModules: [],
        },
        select: { ...userRecordSelect, appleRefreshToken: true },
      });
    }

    const { appleRefreshToken: _stored, ...record } = user;
    void _stored;
    const publicUser = toPublicUser(await ensureAdminRole(record));
    assertMaintenanceAccess(publicUser);
    return sessionFor(publicUser, issue);
  }

  /**
   * Links a Google account to the signed-in account (any Google email: the user proves both).
   * A Google account can belong to only one MindKeep account.
   */
  async linkGoogle(userId: string, input: GoogleLinkInput): Promise<PublicUser> {
    const identity = await verifyGoogleIdentity(input);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userRecordSelect });
    if (!user) {
      throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    if (user.googleId === identity.sub) {
      return toPublicUser(await ensureAdminRole(user));
    }
    if (user.googleId) {
      throw new AppError('Another Google account is already connected. Disconnect it first.', {
        statusCode: 409,
        code: 'GOOGLE_ALREADY_LINKED',
      });
    }
    const owner = await prisma.user.findUnique({ where: { googleId: identity.sub }, select: { id: true } });
    if (owner && owner.id !== user.id) {
      throw new AppError('This Google account is connected to another MindKeep account.', {
        statusCode: 409,
        code: 'GOOGLE_ACCOUNT_IN_USE',
      });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: identity.sub },
      select: userRecordSelect,
    });
    return toPublicUser(await ensureAdminRole(updated));
  }

  /** Disconnects Google; only when a password is set, so the account stays reachable. */
  async unlinkGoogle(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userRecordSelect });
    if (!user) {
      throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    if (!user.passwordHash) {
      throw new AppError('Set a password before disconnecting Google.', {
        statusCode: 400,
        code: 'PASSWORD_REQUIRED',
      });
    }
    if (!user.googleId) {
      return toPublicUser(await ensureAdminRole(user));
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: null },
      select: userRecordSelect,
    });
    return toPublicUser(await ensureAdminRole(updated));
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true, name: true },
    });

    if (!user?.passwordHash) {
      return;
    }

    const token = await issueEmailToken({
      type: EmailTokenType.RESET_PASSWORD,
      email,
    });

    try {
      const mail = resetPasswordEmail(
        resolveAppLocale(input.locale),
        user.name,
        appLink('/reset-password', token),
      );
      await sendEmail({
        to: email,
        subject: mail.subject,
        text: mail.text,
      });
    } catch {
      // Same response either way so this path cannot be used to probe emails.
    }
  }

  async resetPassword(
    input: ResetPasswordInput,
    issue?: AuthSessionIssue,
  ): Promise<{ user: PublicUser; token: string; refreshToken?: string }> {
    const consumed = await consumeEmailToken(EmailTokenType.RESET_PASSWORD, input.token);
    const user = await prisma.user.findUnique({
      where: { email: consumed.email },
      select: userRecordSelect,
    });

    if (!user) {
      throw new AppError('This link is invalid or has expired', {
        statusCode: 400,
        code: 'INVALID_EMAIL_TOKEN',
      });
    }

    const passwordHash = await hashPassword(input.password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerified: true },
      select: userRecordSelect,
    });

    await revokeAuthSessionsForUser(user.id);

    const withRole = await ensureAdminRole(updated);
    const publicUser = toPublicUser(withRole);
    assertMaintenanceAccess(publicUser);
    return sessionFor(publicUser, issue);
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    currentJti?: string,
  ): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userRecordSelect,
    });

    if (!user) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    if (user.passwordHash) {
      const ok = await verifyPassword(input.currentPassword ?? '', user.passwordHash);
      if (!ok) {
        throw new AppError('Current password is incorrect', {
          statusCode: 401,
          code: 'INVALID_PASSWORD',
        });
      }
    }

    const passwordHash = await hashPassword(input.password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
      select: userRecordSelect,
    });
    await revokeAuthSessionsForUser(user.id, currentJti);
    return toPublicUser(await ensureAdminRole(updated));
  }

  async deleteAccount(userId: string, input: DeleteAccountInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, appleRefreshToken: true },
    });

    if (!user) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    if (user.passwordHash) {
      const ok = await verifyPassword(input.password ?? '', user.passwordHash);
      if (!ok) {
        throw new AppError('Current password is incorrect', {
          statusCode: 401,
          code: 'INVALID_PASSWORD',
        });
      }
    }

    await cancelStripeForDeletedUser(user.id);
    // Apple requires revoking Sign in with Apple when the account is deleted (best effort).
    if (user.appleRefreshToken) {
      await revokeAppleRefreshToken(user.appleRefreshToken);
    }
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.emailToken.deleteMany({ where: { email: user.email } });
          await tx.authSession.deleteMany({ where: { userId: user.id } });
          await tx.user.delete({ where: { id: user.id } });
        },
        { timeout: 20_000, maxWait: 10_000 },
      );
    } catch {
      throw new AppError('Could not delete this account', {
        statusCode: 500,
        code: 'DELETE_FAILED',
      });
    }

    const leftover = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (leftover) {
      throw new AppError('Could not delete this account', {
        statusCode: 500,
        code: 'DELETE_FAILED',
      });
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userRecordSelect,
    });

    if (!user) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    return toPublicUser(await ensureAdminRole(user));
  }

  async completeOnboarding(userId: string, input: OnboardingInput): Promise<PublicUser> {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    });
    if (!current) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const modules = normalizeAppModules(input.modules);
    if (modules.length === 0) {
      throw new AppError('Choose at least one service', {
        statusCode: 400,
        code: 'ONBOARDING_REQUIRED',
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompletedAt: current.onboardingCompletedAt ?? new Date(),
        enabledModules: modules,
      },
      select: userRecordSelect,
    });

    if (input.nutritionMacros !== undefined && modules.includes('nutrition')) {
      await prisma.nutritionSettings.upsert({
        where: { userId },
        create: { userId, macrosEnabled: input.nutritionMacros },
        update: { macrosEnabled: input.nutritionMacros },
      });
    }

    return toPublicUser(await ensureAdminRole(updated));
  }

  async updateMe(userId: string, input: UpdateMeInput): Promise<PublicUser> {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: userRecordSelect,
    });
    if (!current) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.timezone) {
      data.timezone = input.timezone;
    }
    if (input.enabledModules) {
      if (!current.onboardingCompletedAt) {
        throw new AppError('Finish the setup quiz first', {
          statusCode: 400,
          code: 'ONBOARDING_REQUIRED',
        });
      }
      const modules = normalizeAppModules(input.enabledModules);
      if (modules.length === 0) {
        throw new AppError('Keep at least one service on', {
          statusCode: 400,
          code: 'ONBOARDING_REQUIRED',
        });
      }
      data.enabledModules = modules;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: userRecordSelect,
    });
    return toPublicUser(await ensureAdminRole(updated));
  }
}

export const authService = new AuthService();
