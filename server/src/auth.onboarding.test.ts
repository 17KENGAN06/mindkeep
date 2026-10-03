import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import app from '@/app.js';
import { ALL_APP_MODULES } from '@/config/appModules.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { issueAuthSession } from '@/services/session.service.js';
import { hashPassword } from '@/utils/password.js';

const TEST_EMAIL_SUFFIX = '@onboarding.mindkeep.test';
const canRun = Boolean(env.DATABASE_URL && env.JWT_SECRET);

type Json = {
  error?: { code?: string };
  user?: {
    id?: string;
    onboardingCompleted?: boolean;
    enabledModules?: string[];
  };
};

describe('workspace onboarding quiz', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';
  let freshId = '';
  let freshToken = '';
  let legacyId = '';
  let legacyToken = '';

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
    const passwordHash = await hashPassword('OnboardPass9');

    const fresh = await prisma.user.create({
      data: {
        name: 'Fresh Quiz User',
        email: `fresh.${stamp}${TEST_EMAIL_SUFFIX}`,
        passwordHash,
      },
    });
    freshId = fresh.id;
    freshToken = (await issueAuthSession(fresh)).token;

    const legacy = await prisma.user.create({
      data: {
        name: 'Legacy Workspace User',
        email: `legacy.${stamp}${TEST_EMAIL_SUFFIX}`,
        passwordHash,
        onboardingCompletedAt: new Date(),
        enabledModules: [],
      },
    });
    legacyId = legacy.id;
    legacyToken = (await issueAuthSession(legacy)).token;

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

  test('new accounts stay gated until they pick at least one service', async () => {
    const me = await api('/api/auth/me', { token: freshToken });
    assert.equal(me.status, 200);
    assert.equal(me.json?.user?.id, freshId);
    assert.equal(me.json?.user?.onboardingCompleted, false);
    assert.deepEqual(me.json?.user?.enabledModules, []);

    const empty = await api('/api/auth/onboarding', {
      token: freshToken,
      method: 'POST',
      body: { modules: [] },
    });
    assert.equal(empty.status, 400);

    const done = await api('/api/auth/onboarding', {
      token: freshToken,
      method: 'POST',
      body: { modules: ['tasks', 'notes', 'bogus'] },
    });
    assert.equal(done.status, 200);
    assert.equal(done.json?.user?.onboardingCompleted, true);
    assert.deepEqual(done.json?.user?.enabledModules, ['tasks', 'notes']);
  });

  test('settings can change modules later but not to none', async () => {
    const patched = await api('/api/auth/me', {
      token: freshToken,
      method: 'PATCH',
      body: { enabledModules: ['review'] },
    });
    assert.equal(patched.status, 200);
    assert.deepEqual(patched.json?.user?.enabledModules, ['review']);

    const none = await api('/api/auth/me', {
      token: freshToken,
      method: 'PATCH',
      body: { enabledModules: [] },
    });
    assert.equal(none.status, 400);
    assert.equal(none.json?.error?.code, 'ONBOARDING_REQUIRED');
  });

  test('existing accounts with an empty module list keep every service', async () => {
    const me = await api('/api/auth/me', { token: legacyToken });
    assert.equal(me.status, 200);
    assert.equal(me.json?.user?.id, legacyId);
    assert.equal(me.json?.user?.onboardingCompleted, true);
    assert.deepEqual(me.json?.user?.enabledModules, [...ALL_APP_MODULES]);
  });

  test('deleted account is gone and a new user with that email starts the quiz', async () => {
    const passwordHash = await hashPassword('DeleteMe99x');
    const email = `doomed.${Date.now()}${TEST_EMAIL_SUFFIX}`;
    const doomed = await prisma.user.create({
      data: {
        name: 'Doomed Quiz',
        email,
        passwordHash,
        onboardingCompletedAt: new Date(),
        enabledModules: ['tasks'],
      },
    });
    const token = (await issueAuthSession(doomed)).token;

    const wrong = await api('/api/auth/delete-account', {
      token,
      method: 'POST',
      body: { password: 'nope', confirm: 'DELETE' },
    });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.json?.error?.code, 'INVALID_PASSWORD');
    assert.ok(await prisma.user.findUnique({ where: { id: doomed.id } }));

    const gone = await api('/api/auth/delete-account', {
      token,
      method: 'POST',
      body: { password: 'DeleteMe99x', confirm: 'DELETE' },
    });
    assert.equal(gone.status, 200);
    assert.equal(await prisma.user.findUnique({ where: { id: doomed.id } }), null);

    const born = await prisma.user.create({
      data: {
        name: 'Born Again',
        email,
        passwordHash,
      },
    });
    const bornToken = (await issueAuthSession(born)).token;
    const me = await api('/api/auth/me', { token: bornToken });
    assert.equal(me.status, 200);
    assert.equal(me.json?.user?.onboardingCompleted, false);
    assert.deepEqual(me.json?.user?.enabledModules, []);
  });
});
