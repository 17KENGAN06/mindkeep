import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { after, before, describe, test } from 'node:test';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { issueAuthSession, revokeAuthSessionsForUser } from '@/services/session.service.js';
import { hashPassword } from '@/utils/password.js';
import { signAccessToken } from '@/utils/jwt.js';

const TEST_EMAIL_SUFFIX = '@session.mindkeep.test';
const canRun = Boolean(env.DATABASE_URL && env.JWT_SECRET);

type Json = { error?: { code?: string }; user?: { id?: string }; success?: boolean };

describe('logout and password change kill leftover JWTs', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';
  let userId = '';
  let keepToken = '';
  let stealToken = '';

  async function api(path: string, options: { token?: string; method?: string; body?: unknown } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        'X-Requested-With': 'learning-reminder',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = (await response.json().catch(() => null)) as Json | null;
    return { status: response.status, json };
  }

  before(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword('OldPassword9');
    const user = await prisma.user.create({
      data: {
        name: 'Session Tester',
        email: `user.${stamp}${TEST_EMAIL_SUFFIX}`,
        passwordHash,
      },
    });

    userId = user.id;
    keepToken = (await issueAuthSession(user)).token;
    stealToken = (await issueAuthSession(user)).token;

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });
  });

  test('a leftover JWT without a session row is rejected', async () => {
    const token = signAccessToken({ sub: userId, email: 'gone@mindkeep.test', jti: 'missing-session' });
    const { status } = await api('/api/auth/me', { token });
    assert.equal(status, 401);
  });

  test('an old JWT without jti is rejected', async () => {
    const token = jwt.sign(
      { sub: userId, email: 'gone@mindkeep.test' },
      env.JWT_SECRET as string,
      { expiresIn: '1h', algorithm: 'HS256' },
    );
    const { status } = await api('/api/auth/me', { token });
    assert.equal(status, 401);
  });

  test('logout revokes that token and leaves the other session alive', async () => {
    const beforeLogout = await api('/api/auth/me', { token: stealToken });
    assert.equal(beforeLogout.status, 200);
    assert.equal(beforeLogout.json?.user?.id, userId);

    const logout = await api('/api/auth/logout', { token: stealToken, method: 'POST' });
    assert.equal(logout.status, 200);
    assert.equal(logout.json?.success, true);

    const afterLogout = await api('/api/auth/me', { token: stealToken });
    assert.equal(afterLogout.status, 401);

    const otherDevice = await api('/api/auth/me', { token: keepToken });
    assert.equal(otherDevice.status, 200);
    assert.equal(otherDevice.json?.user?.id, userId);
  });

  test('changing password kills other sessions and keeps the current one', async () => {
    const other = (await issueAuthSession({ id: userId, email: 'keep@mindkeep.test' })).token;

    const changed = await api('/api/auth/change-password', {
      token: keepToken,
      method: 'POST',
      body: {
        currentPassword: 'OldPassword9',
        password: 'NewPassword9',
        confirmPassword: 'NewPassword9',
      },
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.json?.user?.id, userId);

    const current = await api('/api/auth/me', { token: keepToken });
    assert.equal(current.status, 200);

    const stolen = await api('/api/auth/me', { token: other });
    assert.equal(stolen.status, 401);
  });

  test('resetting all sessions then issuing a new one leaves old tokens dead', async () => {
    const leftover = keepToken;
    await revokeAuthSessionsForUser(userId);
    const fresh = (await issueAuthSession({ id: userId, email: 'fresh@mindkeep.test' })).token;

    const dead = await api('/api/auth/me', { token: leftover });
    assert.equal(dead.status, 401);

    const alive = await api('/api/auth/me', { token: fresh });
    assert.equal(alive.status, 200);
  });
});
