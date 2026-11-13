import { createHash, timingSafeEqual } from 'node:crypto';
import { PlanInterval, StoreKind, UserPlan } from '@prisma/client';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';

/**
 * App Store / Google Play subscriptions through RevenueCat.
 *
 * The app identifies purchases with our user id (Purchases.logIn(user.id)). The server never
 * trusts purchase data from the client or the webhook body: it always asks the RevenueCat REST
 * API for the subscriber and mirrors the best active subscription into StoreSubscription.
 * Stripe (web) data on User is never touched here.
 */

const REVENUECAT_API = 'https://api.revenuecat.com/v1';
const REQUEST_TIMEOUT_MS = 10_000;

/** Product ids configured in App Store Connect (and later Play). Unknown ids grant nothing. */
export const STORE_PRODUCTS: Record<string, { plan: UserPlan; interval: PlanInterval }> = {
  'cloud.mindkeep.app.plus.monthly': { plan: UserPlan.PLUS, interval: PlanInterval.MONTH },
  'cloud.mindkeep.app.plus.yearly': { plan: UserPlan.PLUS, interval: PlanInterval.YEAR },
  'cloud.mindkeep.app.pro.monthly': { plan: UserPlan.PRO, interval: PlanInterval.MONTH },
  'cloud.mindkeep.app.pro.yearly': { plan: UserPlan.PRO, interval: PlanInterval.YEAR },
};

/** Play product ids may come as "<subscription>:<base plan>". */
export function productPlan(productId: string): { plan: UserPlan; interval: PlanInterval } | null {
  const base = productId.split(':')[0] ?? productId;
  return STORE_PRODUCTS[base] ?? null;
}

type RevenueCatSubscription = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  store?: string | null;
  unsubscribe_detected_at?: string | null;
  refunded_at?: string | null;
  is_sandbox?: boolean | null;
};

export type StoreSubscriptionData = {
  store: StoreKind;
  productId: string;
  plan: UserPlan;
  interval: PlanInterval;
  expiresAt: Date | null;
  willRenew: boolean;
  sandbox: boolean;
};

const STORE_KINDS: Record<string, StoreKind> = {
  app_store: StoreKind.APP_STORE,
  play_store: StoreKind.PLAY_STORE,
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The best active App Store / Play subscription: Pro over Plus, then the later expiry. */
export function pickStoreSubscription(
  subscriptions: Record<string, RevenueCatSubscription> | null | undefined,
  now: number = Date.now(),
): StoreSubscriptionData | null {
  let best: StoreSubscriptionData | null = null;
  for (const [productId, subscription] of Object.entries(subscriptions ?? {})) {
    const store = STORE_KINDS[subscription.store ?? ''];
    const mapped = productPlan(productId);
    if (!store) continue;
    if (!mapped) {
      logger.warn('Unknown store product ignored', { productId });
      continue;
    }
    if (subscription.refunded_at) continue;

    const expires = parseDate(subscription.expires_date);
    const grace = parseDate(subscription.grace_period_expires_date);
    const expiresAt = expires && grace && grace > expires ? grace : expires;
    if (expiresAt && expiresAt.getTime() <= now) continue;

    const candidate: StoreSubscriptionData = {
      store,
      productId,
      plan: mapped.plan,
      interval: mapped.interval,
      expiresAt,
      willRenew: !subscription.unsubscribe_detected_at,
      sandbox: Boolean(subscription.is_sandbox),
    };
    if (!best) {
      best = candidate;
      continue;
    }
    const betterPlan = candidate.plan === UserPlan.PRO && best.plan !== UserPlan.PRO;
    const samePlan = candidate.plan === best.plan;
    const later =
      !candidate.expiresAt || (best.expiresAt !== null && candidate.expiresAt > best.expiresAt);
    if (betterPlan || (samePlan && later)) best = candidate;
  }
  return best;
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(env.REVENUECAT_API_KEY);
}

async function fetchSubscriptions(
  appUserId: string,
): Promise<Record<string, RevenueCatSubscription> | null> {
  const key = env.REVENUECAT_API_KEY;
  if (!key) {
    throw new AppError('In-app purchases are not configured', {
      statusCode: 503,
      code: 'STORE_BILLING_NOT_CONFIGURED',
    });
  }

  let response: Response;
  try {
    response = await fetch(`${REVENUECAT_API}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logger.error('RevenueCat request failed', { message: (error as Error).message });
    throw new AppError('Store billing is unavailable', { statusCode: 502, code: 'STORE_BILLING_UNAVAILABLE' });
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    logger.error('RevenueCat returned an error', { status: response.status });
    throw new AppError('Store billing is unavailable', { statusCode: 502, code: 'STORE_BILLING_UNAVAILABLE' });
  }

  const body = (await response.json()) as {
    subscriber?: { subscriptions?: Record<string, RevenueCatSubscription> };
  };
  return body.subscriber?.subscriptions ?? null;
}

/** Re-reads the user's store subscriptions from RevenueCat and stores the best active one. */
export async function syncStoreSubscription(userId: string): Promise<StoreSubscriptionData | null> {
  const subscriptions = await fetchSubscriptions(userId);
  const best = pickStoreSubscription(subscriptions);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return null;

  if (!best) {
    await prisma.storeSubscription.deleteMany({ where: { userId } });
    return null;
  }

  await prisma.storeSubscription.upsert({
    where: { userId },
    create: { userId, ...best },
    update: best,
  });
  return best;
}

/** Constant-time check of the webhook Authorization header ("<secret>" or "Bearer <secret>"). */
export function verifyRevenueCatAuthorization(
  header: string | undefined,
  secret: string | undefined,
): boolean {
  if (!header || !secret) return false;
  const value = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header;
  const digest = (text: string) => createHash('sha256').update(text).digest();
  return timingSafeEqual(digest(value.trim()), digest(secret));
}

type RevenueCatEvent = {
  type?: unknown;
  app_user_id?: unknown;
  original_app_user_id?: unknown;
  aliases?: unknown;
  transferred_from?: unknown;
  transferred_to?: unknown;
};

/** Every non-anonymous app user id an event mentions (a transfer touches two users). */
export function webhookUserIds(event: RevenueCatEvent | null | undefined): string[] {
  if (!event) return [];
  const values: unknown[] = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
    ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
    ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
  ];
  const ids = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const id = value.trim();
    if (!id || id.startsWith('$RCAnonymousID') || id.length > 100) continue;
    ids.add(id);
  }
  return [...ids].slice(0, 20);
}

/** Webhook: authenticate, then re-sync every known user the event mentions. */
export async function handleRevenueCatWebhook(
  authorization: string | undefined,
  body: unknown,
): Promise<{ synced: number }> {
  if (!env.REVENUECAT_WEBHOOK_SECRET) {
    throw new AppError('In-app purchases are not configured', {
      statusCode: 503,
      code: 'STORE_BILLING_NOT_CONFIGURED',
    });
  }
  if (!verifyRevenueCatAuthorization(authorization, env.REVENUECAT_WEBHOOK_SECRET)) {
    throw new AppError('Invalid webhook authorization', { statusCode: 401, code: 'UNAUTHORIZED' });
  }

  const event = (body as { event?: RevenueCatEvent } | null)?.event;
  if (event?.type === 'TEST') return { synced: 0 };

  const ids = webhookUserIds(event);
  if (ids.length === 0) return { synced: 0 };

  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  for (const user of users) {
    await syncStoreSubscription(user.id);
  }
  return { synced: users.length };
}
