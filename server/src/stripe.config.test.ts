import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isLiveStripeSecret,
  stripeBillingReady,
  stripeCheckoutLocale,
  stripePricesLookValid,
  stripeReturnUrls,
} from '@/config/stripe.js';

test('live secret prefix is required in production', () => {
  assert.equal(isLiveStripeSecret('sk_live_abc'), true);
  assert.equal(isLiveStripeSecret('rk_live_abc'), true);
  assert.equal(isLiveStripeSecret('sk_test_abc'), false);
  assert.equal(isLiveStripeSecret('rk_test_abc'), false);
  assert.equal(
    stripeBillingReady({
      nodeEnv: 'production',
      secret: 'sk_test_abc',
      monthly: 'price_month',
      yearly: 'price_year',
    }),
    false,
  );
  assert.equal(
    stripeBillingReady({
      nodeEnv: 'production',
      secret: 'sk_live_abc',
      monthly: 'price_month',
      yearly: 'price_year',
    }),
    true,
  );
  assert.equal(
    stripeBillingReady({
      nodeEnv: 'production',
      secret: 'rk_live_abc',
      monthly: 'price_month',
      yearly: 'price_year',
    }),
    true,
  );
});

test('sandbox keys still work outside production', () => {
  assert.equal(
    stripeBillingReady({
      nodeEnv: 'development',
      secret: 'sk_test_abc',
      monthly: 'price_month',
      yearly: 'price_year',
    }),
    true,
  );
});

test('price ids must be distinct Stripe prices', () => {
  assert.equal(stripePricesLookValid('price_a', 'price_a'), false);
  assert.equal(stripePricesLookValid('not-a-price', 'price_b'), false);
  assert.equal(stripePricesLookValid('price_a', 'price_b'), true);
});

test('checkout locale maps known languages and falls back', () => {
  assert.equal(stripeCheckoutLocale('ru-RU'), 'ru');
  assert.equal(stripeCheckoutLocale('uk'), 'auto');
  assert.equal(stripeCheckoutLocale('de,en;q=0.8'), 'de');
});

test('native checkout returns to a public https page, not cookie /account', () => {
  const native = stripeReturnUrls('https://mindkeep.cloud', true);
  assert.equal(
    native.success,
    'https://mindkeep.cloud/billing/return?status=success&session_id={CHECKOUT_SESSION_ID}',
  );
  assert.equal(native.cancel, 'https://mindkeep.cloud/billing/return?status=canceled');
  assert.equal(native.portal, 'https://mindkeep.cloud/billing/return?status=portal');

  const web = stripeReturnUrls('https://mindkeep.cloud/', false);
  assert.equal(
    web.success,
    'https://mindkeep.cloud/account?billing=success&session_id={CHECKOUT_SESSION_ID}',
  );
  assert.equal(web.portal, 'https://mindkeep.cloud/account');
});
