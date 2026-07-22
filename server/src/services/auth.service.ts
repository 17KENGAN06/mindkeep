import { Prisma, UserRole } from '@prisma/client';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import type { LoginInput, RegisterInput } from '@/validations/auth.schemas.js';
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
