import { PlanInterval, Prisma, UserPlan } from '@prisma/client';
import type Stripe from 'stripe';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import {
  getStripe,
  intervalForPriceId,
  isStripeConfigured,
  isStripeWebhookConfigured,
  priceIdForInterval,
  stripeCheckoutLocale,
  stripeReturnUrls,
} from '@/config/stripe.js';
import { AppError } from '@/utils/AppError.js';

const PRO_STATUSES = new Set(['active', 'trialing', 'past_due']);

function billingUnavailable(): never {
  throw new AppError('Billing is not configured', {
    statusCode: 503,
    code: 'BILLING_UNAVAILABLE',
  });
}

function isMissingStripeObject(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'resource_missing'
  );
}

async function clearDeadSubscription(userId: string, alsoCustomer: boolean): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      ...(alsoCustomer ? { stripeCustomerId: null } : {}),
      plan: UserPlan.FREE,
      planInterval: null,
      planExpiresAt: null,
      cancelAtPeriodEnd: false,
    },
  });
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  const fromItem = item?.current_period_end;
  const fromSub = (subscription as { current_period_end?: number }).current_period_end;
  const unix = fromItem ?? fromSub;
  return typeof unix === 'number' ? new Date(unix * 1000) : null;
}

function subscriptionPriceId(subscription: Stripe.Subscription): string | null {
  const price = subscription.items?.data?.[0]?.price;
  if (!price) return null;
  return typeof price === 'string' ? price : price.id;
}

function subscriptionIdOf(value: string | Stripe.Subscription | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (legacy) return subscriptionIdOf(legacy);
  const parent = (
    invoice as {
      parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } };
    }
  ).parent?.subscription_details?.subscription;
  return subscriptionIdOf(parent ?? null);
}

async function findUserIdForObject(params: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<string | null> {
  if (params.userId) {
    const byId = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
    if (byId) return byId.id;
  }
  if (params.customerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: params.customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;
  }
  if (params.subscriptionId) {
    const bySub = await prisma.user.findFirst({
      where: { stripeSubscriptionId: params.subscriptionId },
      select: { id: true },
    });
    if (bySub) return bySub.id;
  }
  return null;
}

export async function applySubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId?: string | null,
): Promise<void> {
  const entitled = PRO_STATUSES.has(subscription.status);
  const priceId = subscriptionPriceId(subscription);
  const interval = intervalForPriceId(priceId) as PlanInterval | null;
  const customer =
    customerId ||
    (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(customer ? { stripeCustomerId: customer } : {}),
      stripeSubscriptionId: entitled ? subscription.id : null,
      plan: entitled ? UserPlan.PRO : UserPlan.FREE,
      planInterval: entitled ? interval : null,
      planExpiresAt: entitled ? subscriptionPeriodEnd(subscription) : null,
      cancelAtPeriodEnd: entitled ? Boolean(subscription.cancel_at_period_end) : false,
    },
  });
}

async function applySubscriptionId(userId: string, subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applySubscription(userId, subscription);
}

export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const userId =
    session.client_reference_id ||
    (typeof session.metadata?.userId === 'string' ? session.metadata.userId : null);
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subId = subscriptionIdOf(session.subscription);
  const resolved = await findUserIdForObject({
    userId,
    customerId,
    subscriptionId: subId,
  });
  if (!resolved || !subId) return;
  await applySubscriptionId(resolved, subId);
}

async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        await applyCheckoutSession(session);
      }
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const userId = await findUserIdForObject({
        userId: subscription.metadata?.userId,
        customerId,
        subscriptionId: subscription.id,
      });
      if (!userId) return;
      await applySubscription(userId, subscription, customerId);
      return;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(invoice);
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      const userId = await findUserIdForObject({ customerId, subscriptionId: subId });
      if (!userId || !subId) return;
      await applySubscriptionId(userId, subId);
      return;
    }
    default:
      return;
  }
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  if (!isStripeWebhookConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
    billingUnavailable();
  }
  if (!signature) {
    throw new AppError('Missing Stripe signature', {
      statusCode: 400,
      code: 'STRIPE_SIGNATURE_MISSING',
    });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('Invalid Stripe signature', {
      statusCode: 400,
      code: 'STRIPE_SIGNATURE_INVALID',
    });
  }

  const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id }, select: { id: true } });
  if (existing) return;

  await applyStripeEvent(event);

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
      throw error;
    }
  }
}

export async function getBillingFlags(userId: string) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });
  return {
    hasStripeCustomer: Boolean(row?.stripeCustomerId),
    subscribed: Boolean(row?.stripeSubscriptionId),
  };
}

async function ensureCustomer(user: { id: string; email: string; name: string; stripeCustomerId: string | null }) {
  const stripe = getStripe();
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) return user.stripeCustomerId;
    } catch (error) {
      if (!isMissingStripeObject(error)) throw error;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: null },
    });
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  interval: 'month' | 'year',
  localeHeader?: string | null,
  nativeClient = false,
): Promise<{ url: string }> {
  if (!isStripeConfigured()) billingUnavailable();
  const priceId = priceIdForInterval(interval);
  if (!priceId) billingUnavailable();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
  }

  const stripe = getStripe();

  if (user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      if (PRO_STATUSES.has(subscription.status)) {
        throw new AppError('This account already has Pro', {
          statusCode: 409,
          code: 'ALREADY_PRO',
        });
      }
      await clearDeadSubscription(user.id, false);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (isMissingStripeObject(error)) {
        await clearDeadSubscription(user.id, false);
      } else {
        throw error;
      }
    }
  }

  const customerId = await ensureCustomer({
    ...user,
    stripeCustomerId: user.stripeCustomerId,
  });
  const returns = stripeReturnUrls(env.CLIENT_URL, nativeClient);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    locale: stripeCheckoutLocale(localeHeader),
    billing_address_collection: 'auto',
    customer_update: { name: 'auto' },
    success_url: returns.success,
    cancel_url: returns.cancel,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  if (!session.url) {
    throw new AppError('Could not start checkout', {
      statusCode: 502,
      code: 'STRIPE_CHECKOUT_FAILED',
    });
  }

  return { url: session.url };
}

export async function createPortalSession(userId: string, nativeClient = false): Promise<{ url: string }> {
  if (!isStripeConfigured()) billingUnavailable();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new AppError('No billing customer for this account', {
      statusCode: 400,
      code: 'BILLING_CUSTOMER_MISSING',
    });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: stripeReturnUrls(env.CLIENT_URL, nativeClient).portal,
    });
    return { url: session.url };
  } catch {
    throw new AppError('Billing portal is not enabled in Stripe', {
      statusCode: 503,
      code: 'BILLING_PORTAL_UNAVAILABLE',
    });
  }
}

export async function syncCheckoutSession(userId: string, sessionId: string): Promise<void> {
  if (!isStripeConfigured()) billingUnavailable();

  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const owner =
    session.client_reference_id ||
    (typeof session.metadata?.userId === 'string' ? session.metadata.userId : null);

  if (owner && owner !== userId) {
    throw new AppError('Checkout session does not belong to this account', {
      statusCode: 403,
      code: 'STRIPE_SESSION_MISMATCH',
    });
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const owned = await prisma.user.findFirst({
    where: { id: userId, ...(customerId ? { stripeCustomerId: customerId } : {}) },
    select: { id: true, stripeCustomerId: true },
  });

  if (owner !== userId && !(owned && customerId && owned.stripeCustomerId === customerId)) {
    throw new AppError('Checkout session does not belong to this account', {
      statusCode: 403,
      code: 'STRIPE_SESSION_MISMATCH',
    });
  }

  await applyCheckoutSession(session);
}

export async function cancelStripeForDeletedUser(userId: string): Promise<void> {
  if (!env.STRIPE_SECRET_KEY) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });
  if (!user) return;

  const stripe = getStripe();
  try {
    if (user.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    }
  } catch {
    // Account deletion continues even if Stripe is unreachable.
  }
  try {
    if (user.stripeCustomerId) {
      await stripe.customers.del(user.stripeCustomerId);
    }
  } catch {
    // Ignore missing customers.
  }
}
