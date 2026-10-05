import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decodeFoodScanImage,
  detectFoodScanMime,
  extractGeminiJson,
  foodScanPrompt,
  parseFoodScanAiPayload,
} from '@/services/food-scan.service.js';
import { AppError } from '@/utils/AppError.js';
import { scanFoodSchema } from '@/validations/nutrition.schemas.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array.from({ length: 40 }, () => 0x00)]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 32 }, () => 0x00)]);

test('foodScanPrompt mentions an optional dish hint and one meal for extra photos', () => {
  const one = foodScanPrompt('en', undefined, 1);
  assert.match(one, /did not describe/);
  assert.match(one, /one meal from this photo/i);

  const many = foodScanPrompt('ru', 'борщ и котлета', 3);
  assert.match(many, /3 photos/);
  assert.match(many, /SUM those calories/i);
  assert.match(many, /different plate/);
  assert.match(many, /борщ и котлета/);
  assert.match(many, /Russian/);

  const textOnly = foodScanPrompt('en', 'oatmeal with banana', 0);
  assert.match(textOnly, /no photo/i);
  assert.match(textOnly, /oatmeal with banana/);
});

test('scanFoodSchema accepts a legacy photo, several images plus a note, or text only', () => {
  const payload = jpeg.toString('base64') + 'A'.repeat(80);
  const legacy = scanFoodSchema.parse({ image: payload, mimeType: 'image/jpeg' });
  assert.equal(legacy.images.length, 1);
  assert.equal(legacy.note, undefined);

  const many = scanFoodSchema.parse({
    note: '  soup  ',
    images: [
      { image: payload, mimeType: 'image/jpeg' },
      { image: payload, mimeType: 'image/jpeg' },
    ],
  });
  assert.equal(many.images.length, 2);
  assert.equal(many.note, 'soup');

  const textOnly = scanFoodSchema.parse({ note: 'борщ и котлета' });
  assert.equal(textOnly.images.length, 0);
  assert.equal(textOnly.note, 'борщ и котлета');

  assert.equal(scanFoodSchema.safeParse({}).success, false);
  assert.equal(scanFoodSchema.safeParse({ note: ' ' }).success, false);
});

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
