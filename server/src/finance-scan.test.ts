import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFinanceScanAiPayload } from '@/services/finance-scan.service.js';
import { AppError } from '@/utils/AppError.js';

test('parseFinanceScanAiPayload keeps signed amounts as positive expense', () => {
  assert.deepEqual(
    parseFinanceScanAiPayload({
      operations: [
        {
          date: '05.10.2026',
          amount: -120.456,
          type: 'EXPENSE',
          currency: 'uah',
          comment: '  ATB  ',
          moneyKind: 'CASH',
        },
      ],
    }),
    [
      {
        date: '2026-10-05',
        amount: 120.46,
        currency: 'UAH',
        type: 'EXPENSE',
        moneyKind: 'CASH',
        comment: 'ATB',
      },
    ],
  );
});

test('parseFinanceScanAiPayload reads hryvnia from the receipt text', () => {
  assert.deepEqual(
    parseFinanceScanAiPayload(
      {
        operations: [
          {
            date: '2026-10-05',
            amount: 87.5,
            type: 'EXPENSE',
            currency: 'грн',
            comment: 'АТБ',
            moneyKind: 'CASH',
          },
        ],
      },
      'EUR',
    ),
    [
      {
        date: '2026-10-05',
        amount: 87.5,
        currency: 'UAH',
        type: 'EXPENSE',
        moneyKind: 'CASH',
        comment: 'АТБ',
      },
    ],
  );
});

test('parseFinanceScanAiPayload uses fallback when currency is missing', () => {
  const [row] = parseFinanceScanAiPayload(
    {
      operations: [{ date: '2026-10-05', amount: 10, type: 'EXPENSE', comment: 'Coffee' }],
    },
    'PLN',
  );
  assert.equal(row?.currency, 'PLN');
});

test('parseFinanceScanAiPayload rejects empty photos', () => {
  assert.throws(
    () => parseFinanceScanAiPayload({ operations: [] }),
    (error: unknown) => error instanceof AppError && error.code === 'FINANCE_SCAN_EMPTY',
  );
});
