import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  applyPeriodLimit,
  budgetPeriodKey,
  parsePeriodLimits,
  yearCapForCurrency,
} from '@/services/finance-limits.js';

describe('finance period limits', () => {
  test('stores a cap on one month without copying it to others', () => {
    const october = applyPeriodLimit({}, 2026, 10, 'UAH', 20000);
    const november = applyPeriodLimit(october, 2026, 11, 'UAH', 8000);
    assert.deepEqual(october[budgetPeriodKey(2026, 10)], { UAH: 20000 });
    assert.equal(october[budgetPeriodKey(2026, 11)], undefined);
    assert.deepEqual(november[budgetPeriodKey(2026, 11)], { UAH: 8000 });
    assert.deepEqual(november[budgetPeriodKey(2026, 10)], { UAH: 20000 });
  });

  test('reads period-keyed json and sums a year from monthly caps', () => {
    const { limits, migratedFromLegacy } = parsePeriodLimits({
      '2026-10': { UAH: 20000, EUR: 100 },
      '2026-11': { UAH: 5000 },
    });
    assert.equal(migratedFromLegacy, false);
    assert.equal(yearCapForCurrency(limits, 2026, 'UAH'), 25000);
    assert.equal(yearCapForCurrency(limits, 2026, 'EUR'), 100);
    assert.equal(yearCapForCurrency(limits, 2025, 'UAH'), null);
  });

  test('clears a currency for a single month', () => {
    const current = applyPeriodLimit({}, 2026, 10, 'UAH', 1000);
    const next = applyPeriodLimit(current, 2026, 10, 'UAH', null);
    assert.deepEqual(next, {});
  });
});
