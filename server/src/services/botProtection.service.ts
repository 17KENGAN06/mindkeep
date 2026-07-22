import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

const MIN_AGE_MS = 400;
const MAX_AGE_MS = 30 * 60 * 1000;

function secret(): string {
  return env.JWT_SECRET ?? 'dev-bot-protection-secret';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createBotChallenge(): { botToken: string } {
  const issuedAt = Date.now();
  const nonce = randomBytes(12).toString('base64url');
  const payload = `${issuedAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  return { botToken: token };
}

export function assertBotProtection(input: {
  botToken?: string;
  website?: string;
}): void {
  // Honeypot — bots often autofill hidden fields
  if (input.website && input.website.trim().length > 0) {
    throw new AppError('Bot check failed', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }

  const token = input.botToken?.trim();

  // Soft mode: allow requests without a challenge token (older clients / rollout).
  // When a token is present, it must be valid.
  if (!token) {
    return;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AppError('Bot check failed', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }

  const [issuedRaw, nonce, signature] = parts;
  if (!issuedRaw || !nonce || !signature) {
    throw new AppError('Bot check failed', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }

  const payload = `${issuedRaw}.${nonce}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) {
    throw new AppError('Bot check failed', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }

  const issuedAt = Number(issuedRaw);
  if (!Number.isFinite(issuedAt)) {
    throw new AppError('Bot check failed', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }

  const age = Date.now() - issuedAt;
  if (age < MIN_AGE_MS || age > MAX_AGE_MS) {
    throw new AppError('Bot check expired or too fast. Refresh and try again.', {
      statusCode: 400,
      code: 'BOT_REJECTED',
    });
  }
}
