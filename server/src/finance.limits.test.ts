import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyMonthlyLimit, parseMonthlyLimits } from '@/services/finance-limits.js';

describe('finance monthly limits', () => {
  test('keeps only known currencies with positive amounts', () => {
    assert.deepEqual(
      parseMonthlyLimits({ UAH: 20000, EUR: '150.255', USD: 0, XXX: 9, bad: true }),
      { UAH: 20000, EUR: 150.26 },
    );
  });

  test('clears a currency when amount is null or not positive', () => {
    const current = parseMonthlyLimits({ UAH: 1000, EUR: 50 });
    assert.deepEqual(applyMonthlyLimit(current, 'UAH', null), { EUR: 50 });
    assert.deepEqual(applyMonthlyLimit(current, 'EUR', 0), { UAH: 1000 });
  });
});
