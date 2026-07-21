import { Prisma } from '@prisma/client';
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
  createdAt: Date;
  updatedAt: Date;
};

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.toLowerCase();

    try {
      const passwordHash = await hashPassword(input.password);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email,
          passwordHash,
          timezone: input.timezone,
        },
        select: publicUserSelect,
      });

      const token = signAccessToken({ sub: user.id, email: user.email });

      return { user, token };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Unable to create account with these details', {
          statusCode: 400,
          code: 'REGISTER_FAILED',
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

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

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

    return user;
  }
}

export const authService = new AuthService();
