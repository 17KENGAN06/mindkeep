import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { describe, test } from 'node:test';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';
import { signAccessToken, verifyAccessToken } from '@/utils/jwt.js';

const canRun = Boolean(env.JWT_SECRET);

describe('access tokens require a session id', { skip: !canRun }, () => {
  test('a token without jti is rejected', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'a@mindkeep.test' },
      env.JWT_SECRET as string,
      { expiresIn: '1h', algorithm: 'HS256' },
    );

    assert.throws(
      () => verifyAccessToken(token),
      (error: unknown) => error instanceof AppError && error.statusCode === 401,
    );
  });

  test('a signed session token round-trips sub, email, and jti', () => {
    const token = signAccessToken({
      sub: 'user-1',
      email: 'a@mindkeep.test',
      jti: 'session-1',
    });
    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, 'user-1');
    assert.equal(payload.email, 'a@mindkeep.test');
    assert.equal(payload.jti, 'session-1');
  });
});
