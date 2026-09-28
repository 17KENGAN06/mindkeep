import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { after, before, describe, test } from 'node:test';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { issueAuthSession } from '@/services/session.service.js';

const TEST_EMAIL_SUFFIX = '@refresh.mindkeep.test';
const canRun = Boolean(env.DATABASE_URL && env.JWT_SECRET);

type Json = {
  error?: { code?: string };
  user?: { id?: string };
  token?: string;
  refreshToken?: string;
  sessions?: { id: string; kind: string; current: boolean }[];
  success?: boolean;
};

describe('native refresh tokens rotate and devices can be revoked', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';
  let userId = '';
  let browserToken = '';
  let nativeToken = '';
  let nativeRefresh = '';

  async function api(
    path: string,
    options: { token?: string; method?: string; body?: unknown } = {},
  ) {
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
    const user = await prisma.user.create({
      data: {
        name: 'Refresh Tester',
        email: `user.${stamp}${TEST_EMAIL_SUFFIX}`,
      },
    });
    userId = user.id;
    browserToken = (await issueAuthSession(user)).token;
    const native = await issueAuthSession(user, { kind: 'native' });
    nativeToken = native.token;
    nativeRefresh = native.refreshToken ?? '';

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

  test('native sessions include a refresh token and a short access token', () => {
    assert.equal(Boolean(nativeRefresh), true);
    const decoded = jwt.decode(nativeToken) as { exp?: number; iat?: number } | null;
    const lifetime = (decoded?.exp ?? 0) - (decoded?.iat ?? 0);
    assert.ok(lifetime <= 15 * 60 + 5);
    assert.ok(lifetime >= 14 * 60);
  });

  test('refresh rotates the token and rejects the old refresh', async () => {
    const first = await api('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: nativeRefresh },
    });
    assert.equal(first.status, 200);
    assert.equal(typeof first.json?.token, 'string');
    assert.equal(typeof first.json?.refreshToken, 'string');
    assert.notEqual(first.json?.refreshToken, nativeRefresh);

    nativeToken = first.json?.token ?? '';
    const oldRefresh = nativeRefresh;
    nativeRefresh = first.json?.refreshToken ?? '';

    const me = await api('/api/auth/me', { token: nativeToken });
    assert.equal(me.status, 200);
    assert.equal(me.json?.user?.id, userId);

    const reused = await api('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: oldRefresh },
    });
    assert.equal(reused.status, 401);
  });

  test('browser sessions stay on the list and a stranger cannot revoke them', async () => {
    const listed = await api('/api/auth/sessions', { token: nativeToken });
    assert.equal(listed.status, 200);
    const mine = listed.json?.sessions ?? [];
    assert.ok(mine.some((row) => row.current && row.kind === 'native'));
    assert.ok(mine.some((row) => row.kind === 'browser' && !row.current));

    const browserId = mine.find((row) => row.kind === 'browser')?.id;
    assert.ok(browserId);

    const stranger = await prisma.user.create({
      data: {
        name: 'Stranger',
        email: `stranger.${Date.now()}${TEST_EMAIL_SUFFIX}`,
      },
    });
    const strangerToken = (await issueAuthSession(stranger)).token;
    const stolen = await api(`/api/auth/sessions/${browserId}`, {
      token: strangerToken,
      method: 'DELETE',
    });
    assert.equal(stolen.status, 404);

    const revoked = await api(`/api/auth/sessions/${browserId}`, {
      token: nativeToken,
      method: 'DELETE',
    });
    assert.equal(revoked.status, 200);

    const dead = await api('/api/auth/me', { token: browserToken });
    assert.equal(dead.status, 401);

    const alive = await api('/api/auth/me', { token: nativeToken });
    assert.equal(alive.status, 200);
  });
});
