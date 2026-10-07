import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import express from 'express';
import { refreshRateLimit, refreshRateLimitKey } from '@/middleware/authRateLimit.js';

// Database-free: a throwaway Express app with only the refresh limiter in front of a stub handler.

describe('refresh rate-limit key', () => {
  const token = 'r'.repeat(43);

  test('keys by token hash and never contains the token', () => {
    const key = refreshRateLimitKey({ refreshToken: token }, '203.0.113.7');
    assert.match(key, /^refresh-token:[0-9a-f]{64}$/);
    assert.equal(key.includes(token), false);
    assert.equal(refreshRateLimitKey({ refreshToken: ` ${token} ` }, 'x'), key);
  });

  test('falls back to the IP key without a token', () => {
    assert.equal(refreshRateLimitKey({}, '203.0.113.7'), 'refresh-ip:203.0.113.7');
    assert.equal(refreshRateLimitKey(undefined, '203.0.113.7'), 'refresh-ip:203.0.113.7');
    assert.equal(refreshRateLimitKey({ refreshToken: 42 }, '203.0.113.7'), 'refresh-ip:203.0.113.7');
  });
});

describe('refresh rate limit per session', () => {
  let baseUrl = '';
  let server: ReturnType<express.Express['listen']>;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.post('/refresh', refreshRateLimit, (_req, res) => {
      res.status(200).json({ ok: true });
    });
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.close();
  });

  const post = (refreshToken: string) =>
    fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

  test('one session is capped while another on the same IP is not', async () => {
    const first = 'a'.repeat(43);
    for (let i = 0; i < 20; i += 1) {
      assert.equal((await post(first)).status, 200);
    }
    assert.equal((await post(first)).status, 429);

    // Same IP (127.0.0.1), different session: its own bucket.
    assert.equal((await post('b'.repeat(43))).status, 200);
  });
});
