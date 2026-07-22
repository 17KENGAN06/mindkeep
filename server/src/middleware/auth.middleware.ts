import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { ACCESS_TOKEN_COOKIE } from '@/config/cookies.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { AppError } from '@/utils/AppError.js';
import { verifyAccessToken } from '@/utils/jwt.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  timezone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isAdminEmail(email: string): boolean {
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token || typeof token !== 'string') {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const payload = verifyAccessToken(token);
  let user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError('User not found', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  // Promote / keep admin from ADMIN_EMAILS without manual SQL.
  if (isAdminEmail(user.email) && user.role !== UserRole.ADMIN) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
      select: publicUserSelect,
    });
  }

  req.user = user;
  next();
});

export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const allowed = req.user.role === UserRole.ADMIN || isAdminEmail(req.user.email);

  if (!allowed) {
    throw new AppError('Admin access required', {
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  }

  next();
});
