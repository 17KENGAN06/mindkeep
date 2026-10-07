import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { assertBotProtection, createBotChallenge } from '@/services/botProtection.service.js';
import { AppError } from '@/utils/AppError.js';

const rejected = (error: unknown) => error instanceof AppError && error.code === 'BOT_REJECTED';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('bot protection token', () => {
  test('a token used immediately is too fast', () => {
    const { botToken } = createBotChallenge();
    assert.throws(() => assertBotProtection({ botToken, website: '' }), rejected);
  });

  // The mobile app waits 450 ms after the challenge response arrives (features/auth/botChallenge.ts).
  test('a token used after the client wait is accepted', async () => {
    const { botToken } = createBotChallenge();
    await sleep(450);
    assert.doesNotThrow(() => assertBotProtection({ botToken, website: '' }));
  });

  test('a tampered token or a filled honeypot is rejected', async () => {
    const { botToken } = createBotChallenge();
    await sleep(450);
    const [issued, nonce] = botToken.split('.');
    assert.throws(() => assertBotProtection({ botToken: `${issued}.${nonce}.forged`, website: '' }), rejected);
    assert.throws(() => assertBotProtection({ botToken, website: 'http://spam.test' }), rejected);
  });
});
