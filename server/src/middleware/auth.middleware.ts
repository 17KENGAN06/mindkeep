import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@/config/cookies.js';
import { prisma } from '@/config/prisma.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { AppError } from '@/utils/AppError.js';
import { verifyAccessToken } from '@/utils/jwt.js';

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token || typeof token !== 'string') {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  req.user = user;
  next();
});
