import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { addMacros, emptyMacroTotals, roundMacro, roundMacroTotals } from '@/services/nutrition-macros.js';
import { estimateCalorieTarget } from '@/services/nutrition-profile.js';
import { parseFoodScanAiPayload } from '@/services/food-scan.service.js';

describe('calorie estimate', () => {
  test('cuts maintenance when the target weight is lower', () => {
    const estimate = estimateCalorieTarget({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 90,
      activity: 'light',
      targetWeightKg: 80,
    });
    assert.equal(estimate.basal, 1880);
    assert.equal(estimate.maintenance, 2590);
    assert.equal(estimate.mode, 'lose');
    assert.equal(estimate.calories, 2200);
    assert.deepEqual(estimate.notes, []);
  });

  test('holds maintenance when the target is the current weight', () => {
    const estimate = estimateCalorieTarget({
      sex: 'female',
      age: 28,
      heightCm: 165,
      weightKg: 60,
      activity: 'moderate',
      targetWeightKg: 60,
    });
    assert.equal(estimate.mode, 'hold');
    assert.equal(estimate.calories, estimate.maintenance);
  });

  test('never drops a deficit under the safe floor and flags it', () => {
    const estimate = estimateCalorieTarget({
      sex: 'female',
      age: 62,
      heightCm: 152,
      weightKg: 48,
      activity: 'sedentary',
      targetWeightKg: 42,
    });
    assert.equal(estimate.mode, 'lose');
    assert.equal(estimate.calories, 1200);
    assert.ok(estimate.calories > estimate.maintenance * 0.85);
    assert.ok(estimate.notes.includes('floored'));
  });

  test('flags a target that is far from the current weight', () => {
    const estimate = estimateCalorieTarget({
      sex: 'female',
      age: 25,
      heightCm: 170,
      weightKg: 95,
      activity: 'sedentary',
      targetWeightKg: 60,
    });
    assert.equal(estimate.mode, 'lose');
    assert.equal(estimate.calories, 1760);
    assert.deepEqual(estimate.notes, ['bigChange']);
  });

  test('warns when the target weight leaves the healthy band', () => {
    const thin = estimateCalorieTarget({
      sex: 'female',
      age: 22,
      heightCm: 175,
      weightKg: 60,
      activity: 'light',
      targetWeightKg: 50,
    });
    assert.ok(thin.notes.includes('targetBelowHealthy'));

    const heavy = estimateCalorieTarget({
      sex: 'male',
      age: 40,
      heightCm: 170,
      weightKg: 85,
      activity: 'light',
      targetWeightKg: 95,
    });
    assert.equal(heavy.mode, 'gain');
    assert.ok(heavy.notes.includes('targetAboveHealthy'));
  });
});

describe('meal macros', () => {
  test('keeps one decimal and drops impossible grams', () => {
    assert.equal(roundMacro(12.34), 12.3);
    assert.equal(roundMacro(null), null);
    assert.equal(roundMacro(-5), null);
    assert.equal(roundMacro(9000), 2000);
  });

  test('sums a day and ignores meals without macros', () => {
    const totals = [
      { protein: 20, fat: 10.5, carbs: 30 },
      { protein: null, fat: null, carbs: null },
      { protein: 5.25, fat: 1, carbs: 0 },
    ].reduce(addMacros, emptyMacroTotals());
    assert.deepEqual(roundMacroTotals(totals), { protein: 25.3, fat: 11.5, carbs: 30 });
  });

  test('scan keeps macros out of the payload when the model omits them', () => {
    assert.deepEqual(parseFoodScanAiPayload({ recognized: true, mealName: 'Soup', totalCalories: 210 }), {
      mealName: 'Soup',
      totalCalories: 210,
    });
    assert.deepEqual(
      parseFoodScanAiPayload({
        recognized: true,
        mealName: 'Chicken rice',
        totalCalories: 610,
        protein: 42.44,
        fat: 'nope',
        carbs: 70,
      }),
      { mealName: 'Chicken rice', totalCalories: 610, protein: 42.4, carbs: 70 },
    );
  });
});
