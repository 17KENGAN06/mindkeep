import Stripe from 'stripe';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

let client: Stripe | null = null;

const CHECKOUT_LOCALES = new Set<Stripe.Checkout.SessionCreateParams.Locale>([
  'de',
  'en',
  'es',
  'fi',
  'fr',
  'it',
  'pl',
  'ru',
]);

export type CheckoutPlan = 'plus' | 'pro';

export function isLiveStripeSecret(key: string | undefined): boolean {
  return Boolean(key?.startsWith('sk_live_') || key?.startsWith('rk_live_'));
}

export function stripePricesLookValid(monthly?: string, yearly?: string): boolean {
  return Boolean(
    monthly?.startsWith('price_') && yearly?.startsWith('price_') && monthly !== yearly,
  );
}

export function stripeBillingReady(params: {
  nodeEnv: string;
  secret?: string;
  monthly?: string;
  yearly?: string;
}): boolean {
  if (!params.secret || !stripePricesLookValid(params.monthly, params.yearly)) return false;
  if (params.nodeEnv === 'production' && !isLiveStripeSecret(params.secret)) return false;
  return true;
}

function proMonthlyId(): string | undefined {
  return env.STRIPE_PRICE_PRO_MONTHLY || env.STRIPE_PRICE_MONTHLY;
}

function proYearlyId(): string | undefined {
  return env.STRIPE_PRICE_PRO_YEARLY || env.STRIPE_PRICE_YEARLY;
}

export function isStripeConfigured(): boolean {
  return stripeBillingReady({
    nodeEnv: env.NODE_ENV,
    secret: env.STRIPE_SECRET_KEY,
    monthly: proMonthlyId(),
    yearly: proYearlyId(),
  });
}

export function isPlusStripeConfigured(): boolean {
  if (!env.STRIPE_SECRET_KEY) return false;
  if (env.NODE_ENV === 'production' && !isLiveStripeSecret(env.STRIPE_SECRET_KEY)) return false;
  const monthly = env.STRIPE_PRICE_PLUS_MONTHLY;
  const yearly = env.STRIPE_PRICE_PLUS_YEARLY;
  if (!stripePricesLookValid(monthly, yearly)) return false;
  const used = new Set([proMonthlyId(), proYearlyId()].filter(Boolean));
  return Boolean(monthly && yearly && !used.has(monthly) && !used.has(yearly));
}

export function isStripeWebhookConfigured(): boolean {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return false;
  if (env.NODE_ENV === 'production' && !isLiveStripeSecret(env.STRIPE_SECRET_KEY)) return false;
  return true;
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      appInfo: { name: 'MindKeep', url: 'https://mindkeep.cloud' },
    });
  }
  return client;
}

export function priceIdForPlan(plan: CheckoutPlan, interval: 'month' | 'year'): string | undefined {
  if (plan === 'plus') {
    return interval === 'year' ? env.STRIPE_PRICE_PLUS_YEARLY : env.STRIPE_PRICE_PLUS_MONTHLY;
  }
  return interval === 'year' ? proYearlyId() : proMonthlyId();
}

export function priceIdForInterval(interval: 'month' | 'year'): string | undefined {
  return priceIdForPlan('pro', interval);
}

function plusPriceIds(): string[] {
  return [env.STRIPE_PRICE_PLUS_MONTHLY, env.STRIPE_PRICE_PLUS_YEARLY].filter(
    (id): id is string => Boolean(id),
  );
}

export function planForPriceId(priceId: string | null | undefined): 'PLUS' | 'PRO' | null {
  if (!priceId) return null;
  if (plusPriceIds().includes(priceId)) return 'PLUS';
  const knownPro = [proMonthlyId(), proYearlyId(), env.STRIPE_PRICE_MONTHLY, env.STRIPE_PRICE_YEARLY].filter(
    Boolean,
  );
  if (knownPro.includes(priceId)) return 'PRO';
  // Unknown prices still count as Pro (never downgrade a payer by mistake), but say so in
  // the logs: it usually means a STRIPE_PRICE_* env var is missing or a price was replaced.
  logger.warn('Unknown Stripe price treated as Pro', { priceId });
  return 'PRO';
}

export function intervalForPriceId(priceId: string | null | undefined): 'MONTH' | 'YEAR' | null {
  if (!priceId) return null;
  if (
    priceId === proYearlyId() ||
    priceId === env.STRIPE_PRICE_YEARLY ||
    priceId === env.STRIPE_PRICE_PLUS_YEARLY ||
    priceId === env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return 'YEAR';
  }
  if (
    priceId === proMonthlyId() ||
    priceId === env.STRIPE_PRICE_MONTHLY ||
    priceId === env.STRIPE_PRICE_PLUS_MONTHLY ||
    priceId === env.STRIPE_PRICE_PRO_MONTHLY
  ) {
    return 'MONTH';
  }
  return null;
}

export function stripeReturnUrls(clientUrl: string, native: boolean) {
  const origin = clientUrl.replace(/\/$/, '');
  if (native) {
    return {
      success: `${origin}/billing/return?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${origin}/billing/return?status=canceled`,
      portal: `${origin}/billing/return?status=portal`,
    };
  }
  return {
    success: `${origin}/account?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${origin}/account?billing=canceled`,
    portal: `${origin}/account`,
  };
}

export function stripeCheckoutLocale(
  header?: string | null,
): Stripe.Checkout.SessionCreateParams.Locale {
  const raw = header?.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  if (raw && CHECKOUT_LOCALES.has(raw as Stripe.Checkout.SessionCreateParams.Locale)) {
    return raw as Stripe.Checkout.SessionCreateParams.Locale;
  }
  return 'auto';
}
