import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlanInterval, StoreKind, UserPlan } from '@prisma/client';
import { effectivePlan, type StorePlan } from '@/services/entitlements.service.js';
import {
  pickStoreSubscription,
  productPlan,
  verifyRevenueCatAuthorization,
  webhookUserIds,
} from '@/services/revenuecat.service.js';

const now = Date.UTC(2026, 10, 13, 12);
const later = new Date(now + 86_400_000);
const earlier = new Date(now - 86_400_000);

function store(plan: UserPlan, expiresAt: Date | null, kind: StoreKind = StoreKind.APP_STORE): StorePlan {
  return { store: kind, plan, interval: PlanInterval.MONTH, expiresAt, willRenew: true };
}

test('effective plan: no store subscription keeps the web values untouched', () => {
  const result = effectivePlan({ plan: UserPlan.PLUS, planExpiresAt: later }, null, now);
  assert.deepEqual(result, { plan: UserPlan.PLUS, planExpiresAt: later, source: 'stripe', store: null });
  const free = effectivePlan({ plan: UserPlan.FREE, planExpiresAt: null }, undefined, now);
  assert.equal(free.source, null);
  assert.equal(free.plan, UserPlan.FREE);
});

test('effective plan: an active App Store plan applies when the web plan is free or expired', () => {
  const fromFree = effectivePlan({ plan: UserPlan.FREE, planExpiresAt: null }, store(UserPlan.PLUS, later), now);
  assert.equal(fromFree.plan, UserPlan.PLUS);
  assert.equal(fromFree.source, 'app_store');
  assert.equal(fromFree.planExpiresAt, later);

  const fromExpired = effectivePlan({ plan: UserPlan.PRO, planExpiresAt: earlier }, store(UserPlan.PLUS, later), now);
  assert.equal(fromExpired.plan, UserPlan.PLUS);
  assert.equal(fromExpired.source, 'app_store');
});

test('effective plan: Pro beats Plus, a tie keeps the web plan', () => {
  const storePro = effectivePlan({ plan: UserPlan.PLUS, planExpiresAt: later }, store(UserPlan.PRO, later), now);
  assert.equal(storePro.plan, UserPlan.PRO);
  assert.equal(storePro.source, 'app_store');

  const webPro = effectivePlan({ plan: UserPlan.PRO, planExpiresAt: null }, store(UserPlan.PLUS, later), now);
  assert.equal(webPro.plan, UserPlan.PRO);
  assert.equal(webPro.source, 'stripe');

  const tie = effectivePlan({ plan: UserPlan.PLUS, planExpiresAt: later }, store(UserPlan.PLUS, later), now);
  assert.equal(tie.source, 'stripe');
});

test('effective plan: an expired store subscription grants nothing; Play is reported as play_store', () => {
  const expired = effectivePlan({ plan: UserPlan.FREE, planExpiresAt: null }, store(UserPlan.PRO, earlier), now);
  assert.equal(expired.plan, UserPlan.FREE);
  assert.equal(expired.source, null);

  const play = effectivePlan(
    { plan: UserPlan.FREE, planExpiresAt: null },
    store(UserPlan.PRO, later, StoreKind.PLAY_STORE),
    now,
  );
  assert.equal(play.source, 'play_store');
});

test('product ids map to plans; Play base plans and unknown ids', () => {
  assert.deepEqual(productPlan('cloud.mindkeep.app.pro.yearly'), { plan: UserPlan.PRO, interval: PlanInterval.YEAR });
  assert.deepEqual(productPlan('cloud.mindkeep.app.plus.monthly:monthly'), {
    plan: UserPlan.PLUS,
    interval: PlanInterval.MONTH,
  });
  assert.equal(productPlan('cloud.mindkeep.app.lifetime'), null);
});

test('picks the best active store subscription and skips refunds, expiries, other stores and unknown products', () => {
  const iso = (date: Date) => date.toISOString();
  const picked = pickStoreSubscription(
    {
      'cloud.mindkeep.app.plus.yearly': { store: 'app_store', expires_date: iso(later) },
      'cloud.mindkeep.app.pro.monthly': { store: 'app_store', expires_date: iso(later), unsubscribe_detected_at: iso(earlier), is_sandbox: true },
      'cloud.mindkeep.app.pro.yearly': { store: 'app_store', expires_date: iso(later), refunded_at: iso(earlier) },
      'cloud.mindkeep.app.unknown': { store: 'app_store', expires_date: iso(later) },
      'price_web': { store: 'stripe', expires_date: iso(later) },
    },
    now,
  );
  assert.deepEqual(picked, {
    store: StoreKind.APP_STORE,
    productId: 'cloud.mindkeep.app.pro.monthly',
    plan: UserPlan.PRO,
    interval: PlanInterval.MONTH,
    expiresAt: later,
    willRenew: false,
    sandbox: true,
  });

  assert.equal(
    pickStoreSubscription({ 'cloud.mindkeep.app.pro.monthly': { store: 'app_store', expires_date: iso(earlier) } }, now),
    null,
  );
  assert.equal(pickStoreSubscription(undefined, now), null);
});

test('billing grace period keeps a lapsed subscription active', () => {
  const picked = pickStoreSubscription(
    {
      'cloud.mindkeep.app.plus.monthly': {
        store: 'app_store',
        expires_date: earlier.toISOString(),
        grace_period_expires_date: later.toISOString(),
      },
    },
    now,
  );
  assert.equal(picked?.expiresAt?.getTime(), later.getTime());
});

test('webhook authorization accepts the secret with or without Bearer, rejects anything else', () => {
  const secret = 'whsec-test-value-1234567890';
  assert.equal(verifyRevenueCatAuthorization(secret, secret), true);
  assert.equal(verifyRevenueCatAuthorization(`Bearer ${secret}`, secret), true);
  assert.equal(verifyRevenueCatAuthorization('wrong', secret), false);
  assert.equal(verifyRevenueCatAuthorization(undefined, secret), false);
  assert.equal(verifyRevenueCatAuthorization(secret, undefined), false);
});

test('webhook user ids include aliases and transfers, never anonymous ids', () => {
  assert.deepEqual(
    webhookUserIds({
      app_user_id: 'user_a',
      original_app_user_id: '$RCAnonymousID:abc',
      aliases: ['user_a', '$RCAnonymousID:abc', 42],
      transferred_from: ['user_b'],
      transferred_to: ['user_c'],
    }),
    ['user_a', 'user_b', 'user_c'],
  );
  assert.deepEqual(webhookUserIds(undefined), []);
});
