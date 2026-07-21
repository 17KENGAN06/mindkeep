import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

export type JwtPayload = {
  sub: string;
  email: string;
};

const TOKEN_TTL = '7d';

function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', {
      statusCode: 500,
      code: 'CONFIG_ERROR',
    });
  }

  return env.JWT_SECRET;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_TTL,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded)) {
      throw new AppError('Invalid token payload', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    const sub = String(decoded.sub);
    const email = 'email' in decoded ? String(decoded.email) : '';

    return { sub, email };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Invalid or expired token', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
}
