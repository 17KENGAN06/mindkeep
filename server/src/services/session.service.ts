import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/config/prisma.js';
import { ACCESS_TOKEN_TTL_MS } from '@/config/cookies.js';
import { AppError } from '@/utils/AppError.js';
import { signAccessToken } from '@/utils/jwt.js';
import { requireDeleted } from '@/utils/owned.js';

export type AuthSessionKind = 'browser' | 'native';

export type AuthSessionIssue = {
  kind?: AuthSessionKind;
};

export type IssuedAuthSession = {
  token: string;
  refreshToken?: string;
};

export type PublicAuthSession = {
  id: string;
  kind: AuthSessionKind;
  current: boolean;
  createdAt: Date;
  expiresAt: Date;
};

const NATIVE_ACCESS_TTL = '15m';
const BROWSER_ACCESS_TTL = '7d';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function asKind(value: string | null | undefined): AuthSessionKind {
  return value === 'native' ? 'native' : 'browser';
}

export async function issueAuthSession(
  user: { id: string; email: string },
  options: AuthSessionIssue = {},
): Promise<IssuedAuthSession> {
  const kind: AuthSessionKind = options.kind === 'native' ? 'native' : 'browser';
  const refreshToken = kind === 'native' ? newRefreshToken() : undefined;
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      kind,
      expiresAt,
      refreshTokenHash: refreshToken ? hashToken(refreshToken) : null,
      refreshExpiresAt: refreshToken ? expiresAt : null,
    },
    select: { id: true },
  });

  const token = signAccessToken(
    { sub: user.id, email: user.email, jti: session.id },
    kind === 'native' ? NATIVE_ACCESS_TTL : BROWSER_ACCESS_TTL,
  );

  return refreshToken ? { token, refreshToken } : { token };
}

export async function findActiveAuthSession(jti: string, userId: string) {
  return prisma.authSession.findFirst({
    where: {
      id: jti,
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
}

export async function revokeAuthSession(jti: string, userId: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { id: jti, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAuthSessionByRefresh(refreshToken: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAuthSessionsForUser(userId: string, exceptJti?: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptJti ? { id: { not: exceptJti } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function rotateNativeRefresh(refreshToken: string): Promise<IssuedAuthSession> {
  const currentHash = hashToken(refreshToken);
  const session = await prisma.authSession.findFirst({
    where: {
      refreshTokenHash: currentHash,
      revokedAt: null,
      refreshExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      user: { select: { id: true, email: true } },
    },
  });

  if (!session) {
    throw new AppError('Invalid or expired token', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const nextRefresh = newRefreshToken();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      kind: 'native',
      expiresAt,
      refreshTokenHash: hashToken(nextRefresh),
      refreshExpiresAt: expiresAt,
    },
  });

  return {
    token: signAccessToken(
      { sub: session.user.id, email: session.user.email, jti: session.id },
      NATIVE_ACCESS_TTL,
    ),
    refreshToken: nextRefresh,
  };
}

export async function listAuthSessions(
  userId: string,
  currentJti?: string,
): Promise<PublicAuthSession[]> {
  const rows = await prisma.authSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      kind: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    kind: asKind(row.kind),
    current: Boolean(currentJti) && row.id === currentJti,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }));
}

export async function revokeOwnedAuthSession(userId: string, sessionId: string): Promise<void> {
  const result = await prisma.authSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  requireDeleted(result.count, 'Session not found', 'SESSION_NOT_FOUND');
}
