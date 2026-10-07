import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getDayBoundsInTimeZone, todayKeyInTimeZone } from '@/utils/timezone.js';

// Pure date math only — nothing here touches the database.

describe('todayKeyInTimeZone', () => {
  test('Helsinki is already on the next day after local midnight while UTC is not (winter, UTC+2)', () => {
    const at = new Date('2026-01-15T22:30:00Z'); // 00:30 in Helsinki
    assert.equal(todayKeyInTimeZone('Europe/Helsinki', at), '2026-01-16');
    assert.equal(todayKeyInTimeZone('UTC', at), '2026-01-15');
  });

  test('Helsinki summer time (UTC+3)', () => {
    const at = new Date('2026-07-15T21:30:00Z'); // 00:30 in Helsinki
    assert.equal(todayKeyInTimeZone('Europe/Helsinki', at), '2026-07-16');
  });

  test('New York is still on the previous day after UTC midnight', () => {
    const at = new Date('2026-01-16T03:00:00Z'); // 22:00 on the 15th in New York
    assert.equal(todayKeyInTimeZone('America/New_York', at), '2026-01-15');
    assert.equal(todayKeyInTimeZone('UTC', at), '2026-01-16');
  });

  test('Auckland (UTC+13 in January) is far ahead of UTC', () => {
    const at = new Date('2026-01-15T11:30:00Z'); // 00:30 on the 16th in Auckland
    assert.equal(todayKeyInTimeZone('Pacific/Auckland', at), '2026-01-16');
  });

  test('UTC matches the ISO date', () => {
    const at = new Date('2026-05-01T23:59:59Z');
    assert.equal(todayKeyInTimeZone('UTC', at), '2026-05-01');
  });
});

describe('getDayBoundsInTimeZone across a DST change', () => {
  test('Helsinki spring-forward day (2026-03-29) is 23 hours long', () => {
    const { startUtc, endUtc } = getDayBoundsInTimeZone('Europe/Helsinki', new Date('2026-03-29T12:00:00Z'));
    assert.equal(startUtc.toISOString(), '2026-03-28T22:00:00.000Z'); // 00:00 EET (UTC+2)
    assert.equal(endUtc.toISOString(), '2026-03-29T20:59:59.999Z'); // 23:59:59.999 EEST (UTC+3)
  });

  test('just after local midnight on the DST day counts as that day', () => {
    assert.equal(todayKeyInTimeZone('Europe/Helsinki', new Date('2026-03-28T22:30:00Z')), '2026-03-29');
  });
});
