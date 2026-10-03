import { EmailTokenType, PlanInterval, Prisma, UserPlan, UserRole } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { env } from '@/config/env.js';
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
import type {
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
  const entitled = isProUser(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    plan: entitled ? UserPlan.PRO : UserPlan.FREE,
    planInterval: entitled ? user.planInterval : null,
    planExpiresAt: entitled ? user.planExpiresAt : null,
    cancelAtPeriodEnd: entitled ? user.cancelAtPeriodEnd : false,
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

    const idToken = input.code
      ? await consumeGoogleSignInTicket(input.code)
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
      select: { id: true, email: true, passwordHash: true },
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
