import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UserPlan, UserRole } from '@prisma/client';
import { throwPlanLimit } from '@/config/entitlements.js';
import { isProUser } from '@/services/entitlements.service.js';
import { AppError } from '@/utils/AppError.js';

test('throwPlanLimit returns PLAN_LIMIT with counts', () => {
  assert.throws(
    () => throwPlanLimit('materials', 20, 20),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.code === 'PLAN_LIMIT' &&
      JSON.stringify(error.details) === JSON.stringify({ feature: 'materials', used: 20, limit: 20 }),
  );
});

test('expired Pro falls back to free', () => {
  assert.equal(
    isProUser({
      email: 'free@mindkeep.test',
      role: UserRole.USER,
      plan: UserPlan.PRO,
      planExpiresAt: new Date(Date.now() - 60_000),
    }),
    false,
  );
});

test('active Pro stays entitled', () => {
  assert.equal(
    isProUser({
      email: 'pro@mindkeep.test',
      role: UserRole.USER,
      plan: UserPlan.PRO,
      planExpiresAt: new Date(Date.now() + 86_400_000),
    }),
    true,
  );
});

test('admins are always Pro', () => {
  assert.equal(
    isProUser({
      email: 'someone@mindkeep.test',
      role: UserRole.ADMIN,
      plan: UserPlan.FREE,
      planExpiresAt: null,
    }),
    true,
  );
});
