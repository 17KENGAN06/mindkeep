import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { issueLoginCode } from '@/services/emailToken.service.js';
import { hashPassword } from '@/utils/password.js';

const TEST_EMAIL_SUFFIX = '@logincode.mindkeep.test';
const canRun = Boolean(env.DATABASE_URL && env.JWT_SECRET);
const PASSWORD = 'LoginCode9x';

type Json = {
  error?: { code?: string };
  user?: { id?: string; email?: string };
  pending?: boolean;
  token?: string;
};

describe('email/password login requires a mailbox code', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';
  let userId = '';
  let email = '';

  async function api(path: string, options: { method?: string; body?: unknown } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'X-Requested-With': 'learning-reminder',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = (await response.json().catch(() => null)) as Json | null;
    return { status: response.status, json, headers: response.headers };
  }

  before(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    email = `user.${stamp}${TEST_EMAIL_SUFFIX}`;
    const user = await prisma.user.create({
      data: {
        name: 'Login Code Tester',
        email,
        passwordHash: await hashPassword(PASSWORD),
      },
    });
    userId = user.id;

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

  test('correct password does not issue a session until the code is confirmed', async () => {
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password: PASSWORD, locale: 'en' },
    });
    assert.equal(login.status, 200);
    assert.equal(login.json?.pending, true);
    assert.equal(login.json?.user, undefined);
    assert.equal(login.json?.token, undefined);
    const cookie = login.headers.get('set-cookie') ?? '';
    assert.equal(cookie.includes('access_token='), false);

    const me = await api('/api/auth/me');
    assert.equal(me.status, 401);

    const wrong = await api('/api/auth/login/code', {
      method: 'POST',
      body: { email, code: '000000' },
    });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.json?.error?.code, 'INVALID_LOGIN_CODE');

    const code = await issueLoginCode(email);
    const confirmed = await api('/api/auth/login/code', {
      method: 'POST',
      body: { email, code },
    });
    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.json?.user?.id, userId);
    assert.equal(confirmed.json?.user?.email, email);
    assert.ok(confirmed.json?.token);
  });

  test('a Google-only account cannot start a password login', async () => {
    const googleEmail = `google.${Date.now()}${TEST_EMAIL_SUFFIX}`;
    await prisma.user.create({
      data: { name: 'Google Only', email: googleEmail, googleId: `gid-${Date.now()}` },
    });

    const login = await api('/api/auth/login', {
      method: 'POST',
      body: { email: googleEmail, password: PASSWORD, locale: 'en' },
    });
    assert.equal(login.status, 401);
    assert.equal(login.json?.error?.code, 'INVALID_CREDENTIALS');
  });
});
