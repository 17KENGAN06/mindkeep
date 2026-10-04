import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decodeFoodScanImage,
  detectFoodScanMime,
  extractGeminiJson,
  parseFoodScanAiPayload,
} from '@/services/food-scan.service.js';
import { AppError } from '@/utils/AppError.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 40 }, () => 0x00)]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 32 }, () => 0x00)]);

test('detects jpeg png and webp magic bytes', () => {
  assert.equal(detectFoodScanMime(jpeg), 'image/jpeg');
  assert.equal(detectFoodScanMime(png), 'image/png');
  const webp = Buffer.alloc(16, 0);
  webp.write('RIFF', 0);
  webp.write('WEBP', 8);
  assert.equal(detectFoodScanMime(webp), 'image/webp');
  assert.equal(detectFoodScanMime(Buffer.from('not-an-image')), null);
});

test('decode rejects mismatched mime and tiny payloads', () => {
  assert.throws(
    () => decodeFoodScanImage(jpeg.toString('base64'), 'image/png'),
    (error: unknown) => error instanceof AppError && error.code === 'FOOD_SCAN_BAD_TYPE',
  );
  assert.throws(
    () => decodeFoodScanImage('abcd', 'image/jpeg'),
    (error: unknown) => error instanceof AppError && error.code === 'FOOD_SCAN_INVALID',
  );
});

test('parseFoodScanAiPayload accepts a plausible meal', () => {
  assert.deepEqual(
    parseFoodScanAiPayload({ recognized: true, mealName: '  Oatmeal  ', totalCalories: 320.4 }),
    { mealName: 'Oatmeal', totalCalories: 320 },
  );
});

test('extractGeminiJson skips thought parts and markdown fences', () => {
  assert.deepEqual(
    extractGeminiJson({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: 'looking at the plate' },
              { text: '```json\n{"recognized":true,"mealName":"Soup","totalCalories":210}\n```' },
            ],
          },
        },
      ],
    }),
    { recognized: true, mealName: 'Soup', totalCalories: 210 },
  );
});

test('parseFoodScanAiPayload rejects empty or unrecognized results', () => {
  assert.throws(
    () => parseFoodScanAiPayload({ recognized: false, mealName: 'table', totalCalories: 12 }),
    (error: unknown) => error instanceof AppError && error.code === 'FOOD_NOT_RECOGNIZED',
  );
  assert.throws(
    () => parseFoodScanAiPayload({ recognized: true, mealName: '', totalCalories: 200 }),
    (error: unknown) => error instanceof AppError && error.code === 'FOOD_NOT_RECOGNIZED',
  );
  assert.throws(
    () => parseFoodScanAiPayload({ recognized: true, mealName: 'Cake', totalCalories: 0 }),
    (error: unknown) => error instanceof AppError && error.code === 'FOOD_NOT_RECOGNIZED',
  );
});
