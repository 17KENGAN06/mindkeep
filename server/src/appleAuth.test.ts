import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { describe, test } from 'node:test';
import { env } from '@/config/env.js';
import {
  appleAudience,
  appleClientSecret,
  resetAppleKeysCache,
  verifyAppleIdentityToken,
} from '@/services/appleAuth.service.js';
import { AppError } from '@/utils/AppError.js';

// A local RSA key stands in for Apple's: the fake fetch serves its public JWK.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-kid', alg: 'RS256', use: 'sig' };
const fakeFetch = (async () =>
  new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })) as unknown as typeof fetch;

function token(claims: Record<string, unknown>, options: jwt.SignOptions = {}) {
  return jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    keyid: 'test-kid',
    issuer: 'https://appleid.apple.com',
    audience: appleAudience(),
    expiresIn: '5m',
    ...options,
  });
}

const rejected = (error: unknown) => error instanceof AppError && error.code === 'INVALID_APPLE_CREDENTIAL';

describe('Sign in with Apple identity token', () => {
  test('a valid token yields the Apple user id and lower-cased email', async () => {
    resetAppleKeysCache();
    const identity = await verifyAppleIdentityToken(token({ sub: 'apple-1', email: 'A@Privaterelay.AppleID.com' }), fakeFetch);
    assert.deepEqual(identity, { sub: 'apple-1', email: 'a@privaterelay.appleid.com' });
  });

  test('wrong audience, wrong issuer, expired or forged tokens are rejected', async () => {
    resetAppleKeysCache();
    await assert.rejects(verifyAppleIdentityToken(token({ sub: 'a' }, { audience: 'com.other.app' }), fakeFetch), rejected);
    await assert.rejects(verifyAppleIdentityToken(token({ sub: 'a' }, { issuer: 'https://evil.example' }), fakeFetch), rejected);
    await assert.rejects(verifyAppleIdentityToken(token({ sub: 'a' }, { expiresIn: -10 }), fakeFetch), rejected);
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const forged = jwt.sign({ sub: 'a' }, other, {
      algorithm: 'RS256',
      keyid: 'test-kid',
      issuer: 'https://appleid.apple.com',
      audience: appleAudience(),
      expiresIn: '5m',
    });
    await assert.rejects(verifyAppleIdentityToken(forged, fakeFetch), rejected);
    await assert.rejects(verifyAppleIdentityToken('not-a-jwt', fakeFetch), rejected);
  });
});

describe('Sign in with Apple client secret', () => {
  test('is an ES256 JWT for Apple with team, key id and bundle id', () => {
    const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const saved = { team: env.APPLE_TEAM_ID, key: env.APPLE_KEY_ID, pem: env.APPLE_PRIVATE_KEY };
    const mutable = env as { APPLE_TEAM_ID?: string; APPLE_KEY_ID?: string; APPLE_PRIVATE_KEY?: string };
    mutable.APPLE_TEAM_ID = 'TEAM123456';
    mutable.APPLE_KEY_ID = 'KEY1234567';
    mutable.APPLE_PRIVATE_KEY = (ec.privateKey.export({ format: 'pem', type: 'pkcs8' }) as string).replace(/\n/g, '\\n');
    try {
      const secret = appleClientSecret();
      const verified = jwt.verify(secret, ec.publicKey, { algorithms: ['ES256'] }) as jwt.JwtPayload;
      const header = jwt.decode(secret, { complete: true })?.header;
      assert.equal(header?.kid, 'KEY1234567');
      assert.equal(verified.iss, 'TEAM123456');
      assert.equal(verified.aud, 'https://appleid.apple.com');
      assert.equal(verified.sub, appleAudience());
      assert.ok((verified.exp ?? 0) - (verified.iat ?? 0) <= 300);
    } finally {
      mutable.APPLE_TEAM_ID = saved.team;
      mutable.APPLE_KEY_ID = saved.key;
      mutable.APPLE_PRIVATE_KEY = saved.pem;
    }
  });
});
