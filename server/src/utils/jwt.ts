import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

export type JwtPayload = {
  sub: string;
  email: string;
  jti: string;
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

export function signAccessToken(payload: JwtPayload, expiresIn: '15m' | '7d' = TOKEN_TTL): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email },
    getJwtSecret(),
    {
      expiresIn,
      algorithm: 'HS256',
      jwtid: payload.jti,
    },
  );
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
    const jti = 'jti' in decoded && typeof decoded.jti === 'string' ? decoded.jti : '';

    if (!jti) {
      throw new AppError('Invalid or expired token', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    }

    return { sub, email, jti };
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
