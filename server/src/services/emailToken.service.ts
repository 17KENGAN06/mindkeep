import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { EmailTokenType } from '@prisma/client';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const LOGIN_CODE_MAX_ATTEMPTS = 5;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function loginCodePepper(): string {
  return env.JWT_SECRET?.trim() || 'mindkeep-login-code';
}

function hashLoginCode(email: string, code: string): string {
  return createHmac('sha256', loginCodePepper()).update(`${email}:${code}`).digest('hex');
}

function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function issueEmailToken(input: {
  type: EmailTokenType;
  email: string;
  payload?: string;
}): Promise<string> {
  const email = input.email.toLowerCase();
  await prisma.emailToken.deleteMany({
    where: {
      OR: [{ email, type: input.type }, { expiresAt: { lt: new Date() } }],
    },
  });

  const token = randomBytes(32).toString('base64url');
  const ttl = input.type === EmailTokenType.RESET_PASSWORD ? RESET_TTL_MS : VERIFY_TTL_MS;
  await prisma.emailToken.create({
    data: {
      type: input.type,
      email,
      codeHash: hashToken(token),
      payload: input.payload,
      expiresAt: new Date(Date.now() + ttl),
    },
  });
  return token;
}

export async function issueLoginCode(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  await prisma.emailToken.deleteMany({
    where: {
      OR: [{ email: normalized, type: EmailTokenType.LOGIN_CODE }, { expiresAt: { lt: new Date() } }],
    },
  });

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailToken.create({
    data: {
      type: EmailTokenType.LOGIN_CODE,
      email: normalized,
      codeHash: hashLoginCode(normalized, code),
      payload: JSON.stringify({ attempts: 0 }),
      expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS),
    },
  });
  return code;
}

export async function consumeLoginCode(email: string, code: string): Promise<void> {
  const normalized = email.toLowerCase();
  const digits = code.replace(/\s/g, '');
  const row = await prisma.emailToken.findFirst({
    where: { email: normalized, type: EmailTokenType.LOGIN_CODE },
  });

  const invalid = () => {
    throw new AppError('That code is incorrect or has expired', {
      statusCode: 400,
      code: 'INVALID_LOGIN_CODE',
    });
  };

  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await prisma.emailToken.delete({ where: { id: row.id } }).catch(() => undefined);
    }
    invalid();
  }

  let attempts: number;
  try {
    const parsed = JSON.parse(row!.payload ?? '{}') as { attempts?: unknown };
    attempts = typeof parsed.attempts === 'number' ? parsed.attempts : 0;
  } catch {
    attempts = 0;
  }

  if (!hashesMatch(row!.codeHash, hashLoginCode(normalized, digits))) {
    attempts += 1;
    if (attempts >= LOGIN_CODE_MAX_ATTEMPTS) {
      await prisma.emailToken.delete({ where: { id: row!.id } }).catch(() => undefined);
    } else {
      await prisma.emailToken
        .update({
          where: { id: row!.id },
          data: { payload: JSON.stringify({ attempts }) },
        })
        .catch(() => undefined);
    }
    invalid();
  }

  await prisma.emailToken.delete({ where: { id: row!.id } }).catch(() => undefined);
}

export async function findValidEmailToken(
  type: EmailTokenType,
  token: string,
): Promise<{ id: string; email: string; payload: string | null }> {
  const codeHash = hashToken(token);
  const row = await prisma.emailToken.findUnique({ where: { codeHash } });
  if (!row || row.type !== type || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await prisma.emailToken.delete({ where: { id: row.id } }).catch(() => undefined);
    }
    throw new AppError('This link is invalid or has expired', {
      statusCode: 400,
      code: 'INVALID_EMAIL_TOKEN',
    });
  }
  return { id: row.id, email: row.email, payload: row.payload };
}

export async function consumeEmailToken(
  type: EmailTokenType,
  token: string,
): Promise<{ email: string; payload: string | null }> {
  const row = await findValidEmailToken(type, token);
  await prisma.emailToken.delete({ where: { id: row.id } }).catch(() => undefined);
  return { email: row.email, payload: row.payload };
}

export async function deleteEmailTokens(email: string, type?: EmailTokenType): Promise<void> {
  await prisma.emailToken.deleteMany({
    where: type ? { email: email.toLowerCase(), type } : { email: email.toLowerCase() },
  });
}
