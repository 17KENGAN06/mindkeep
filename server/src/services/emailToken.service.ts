import { createHash, randomBytes } from 'node:crypto';
import { EmailTokenType } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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
