import Stripe from 'stripe';
import { env } from '@/config/env.js';

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_MONTHLY && env.STRIPE_PRICE_YEARLY);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
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
