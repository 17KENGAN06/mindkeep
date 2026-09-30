import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import app from '@/app.js';
import { env } from '@/config/env.js';

const canRun = Boolean(env.JWT_SECRET);

describe('Stripe webhook bypasses cookie CSRF', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
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
  });

  test('POST /api/billing/webhook is not rejected as CSRF', async () => {
    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const json = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    assert.notEqual(response.status, 403);
    assert.notEqual(json?.error?.code, 'CSRF_REJECTED');
    assert.ok(response.status === 400 || response.status === 503);
  });
});
