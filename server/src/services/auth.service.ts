import { Prisma, UserRole } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
} from '@/validations/auth.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { signAccessToken } from '@/utils/jwt.js';
import { hashPassword, verifyPassword } from '@/utils/password.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  timezone: true,
  role: true,
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
  createdAt: Date;
  updatedAt: Date;
};

function shouldBeAdmin(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}

async function ensureAdminRole(user: PublicUser): Promise<PublicUser> {
  if (!shouldBeAdmin(user.email) || user.role === UserRole.ADMIN) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
    select: publicUserSelect,
  });
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.toLowerCase();

    try {
      const passwordHash = await hashPassword(input.password);
      const role = shouldBeAdmin(email) ? UserRole.ADMIN : UserRole.USER;

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email,
          passwordHash,
          timezone: input.timezone,
          role,
        },
        select: publicUserSelect,
      });

      const token = signAccessToken({ sub: user.id, email: user.email });

      return { user, token };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('This email is already registered', {
          statusCode: 409,
          code: 'EMAIL_TAKEN',
        });
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const isValid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || !isValid) {
      throw new AppError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    let publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    publicUser = await ensureAdminRole(publicUser);

    const token = signAccessToken({ sub: user.id, email: user.email });

    return { user: publicUser, token };
  }

  async googleLogin(input: GoogleLoginInput): Promise<{ user: PublicUser; token: string }> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google sign-in is not configured', {
        statusCode: 503,
        code: 'GOOGLE_AUTH_UNAVAILABLE',
      });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
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
      select: publicUserSelect,
    });

    if (!user) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser?.googleId && existingUser.googleId !== payload.sub) {
        throw new AppError('This email is linked to another Google account', {
          statusCode: 409,
          code: 'GOOGLE_ACCOUNT_CONFLICT',
        });
      }

      const role = shouldBeAdmin(email) ? UserRole.ADMIN : UserRole.USER;
      user = existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: { googleId: payload.sub },
            select: publicUserSelect,
          })
        : await prisma.user.create({
            data: {
              name,
              email,
              googleId: payload.sub,
              timezone: input.timezone,
              role,
            },
            select: publicUserSelect,
          });
    }

    user = await ensureAdminRole(user);
    const token = signAccessToken({ sub: user.id, email: user.email });
    return { user, token };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError('User not found', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    return ensureAdminRole(user);
  }
}

export const authService = new AuthService();
