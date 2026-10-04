import Stripe from 'stripe';
import { env } from '@/config/env.js';

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

export function isLiveStripeSecret(key: string | undefined): boolean {
  return Boolean(key?.startsWith('sk_live_'));
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

export function isStripeConfigured(): boolean {
  return stripeBillingReady({
    nodeEnv: env.NODE_ENV,
    secret: env.STRIPE_SECRET_KEY,
    monthly: env.STRIPE_PRICE_MONTHLY,
    yearly: env.STRIPE_PRICE_YEARLY,
  });
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

export function priceIdForInterval(interval: 'month' | 'year'): string | undefined {
  return interval === 'year' ? env.STRIPE_PRICE_YEARLY : env.STRIPE_PRICE_MONTHLY;
}

export function intervalForPriceId(priceId: string | null | undefined): 'MONTH' | 'YEAR' | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_YEARLY) return 'YEAR';
  if (priceId === env.STRIPE_PRICE_MONTHLY) return 'MONTH';
  return null;
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
