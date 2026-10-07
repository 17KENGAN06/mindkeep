import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { describe, test } from 'node:test';
import { env } from '@/config/env.js';
import { signAccessToken } from '@/utils/jwt.js';
import { sessionRateLimitKey } from '@/utils/rateLimitKey.js';

const canRun = Boolean(env.JWT_SECRET);

describe('global rate limit session key', { skip: !canRun }, () => {
  test('a valid access token is keyed by its session id', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@mindkeep.test', jti: 'session-1' });
    assert.equal(sessionRateLimitKey(token), 'session:session-1');
  });

  test('missing, random, forged and expired tokens fall back to the IP bucket', () => {
    assert.equal(sessionRateLimitKey(undefined), undefined);
    assert.equal(sessionRateLimitKey('x'.repeat(64)), undefined);

    const forged = jwt.sign({ sub: 'user-1', email: 'a@mindkeep.test' }, 'not-the-real-secret-0123456789', {
      algorithm: 'HS256',
      expiresIn: '1h',
      jwtid: 'session-1',
    });
    assert.equal(sessionRateLimitKey(forged), undefined);

    const expired = jwt.sign({ sub: 'user-1', email: 'a@mindkeep.test' }, env.JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: -10,
      jwtid: 'session-1',
    });
    assert.equal(sessionRateLimitKey(expired), undefined);
  });

  test('two different sessions get different buckets', () => {
    const a = signAccessToken({ sub: 'user-1', email: 'a@mindkeep.test', jti: 'session-a' });
    const b = signAccessToken({ sub: 'user-1', email: 'a@mindkeep.test', jti: 'session-b' });
    assert.notEqual(sessionRateLimitKey(a), sessionRateLimitKey(b));
  });
});
