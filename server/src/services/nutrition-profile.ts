export type BodySex = 'male' | 'female';
export type BodyActivity = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export const BODY_SEXES: BodySex[] = ['male', 'female'];
export const BODY_ACTIVITIES: BodyActivity[] = ['sedentary', 'light', 'moderate', 'high', 'athlete'];

const ACTIVITY_FACTOR: Record<BodyActivity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

// Below these the day stops covering basic needs, so a deficit never goes under them.
const CALORIE_FLOOR: Record<BodySex, number> = { male: 1500, female: 1200 };
const DEFICIT_SHARE = 0.15;
const SURPLUS_SHARE = 0.1;
const GOAL_MIN = 500;
const GOAL_MAX = 10_000;

export type CalorieEstimateInput = {
  sex: BodySex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: BodyActivity;
  targetWeightKg: number;
};

/** Translation keys the clients render next to the number. */
export type CalorieEstimateNote =
  | 'targetBelowHealthy'
  | 'targetAboveHealthy'
  | 'bigChange'
  | 'floored';

export type CalorieEstimate = {
  calories: number;
  maintenance: number;
  basal: number;
  mode: 'lose' | 'gain' | 'hold';
  targetWeightKg: number;
  targetBmi: number;
  notes: CalorieEstimateNote[];
};

function roundTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function clampGoal(value: number): number {
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, value));
}

export function basalRate(input: Omit<CalorieEstimateInput, 'activity' | 'targetWeightKg'>): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return base + (input.sex === 'male' ? 5 : -161);
}

export function estimateCalorieTarget(input: CalorieEstimateInput): CalorieEstimate {
  const basal = Math.round(basalRate(input));
  const maintenance = roundTen(basal * ACTIVITY_FACTOR[input.activity]);
  const delta = input.targetWeightKg - input.weightKg;
  const mode = delta <= -0.5 ? 'lose' : delta >= 0.5 ? 'gain' : 'hold';

  const raw =
    mode === 'lose'
      ? maintenance * (1 - DEFICIT_SHARE)
      : mode === 'gain'
        ? maintenance * (1 + SURPLUS_SHARE)
        : maintenance;

  const floor = Math.max(CALORIE_FLOOR[input.sex], basal);
  const floored = mode === 'lose' && raw < floor;
  const calories = clampGoal(roundTen(floored ? floor : raw));

  const meters = input.heightCm / 100;
  const targetBmi = Math.round((input.targetWeightKg / (meters * meters)) * 10) / 10;

  const notes: CalorieEstimateNote[] = [];
  if (targetBmi < 18.5) notes.push('targetBelowHealthy');
  if (targetBmi >= 30) notes.push('targetAboveHealthy');
  if (Math.abs(delta) > input.weightKg * 0.2) notes.push('bigChange');
  if (floored) notes.push('floored');

  return {
    calories,
    maintenance: clampGoal(maintenance),
    basal,
    mode,
    targetWeightKg: Math.round(input.targetWeightKg * 10) / 10,
    targetBmi,
    notes,
  };
}

export function parseBodySex(value: unknown): BodySex | null {
  return typeof value === 'string' && BODY_SEXES.includes(value as BodySex)
    ? (value as BodySex)
    : null;
}

export function parseBodyActivity(value: unknown): BodyActivity | null {
  return typeof value === 'string' && BODY_ACTIVITIES.includes(value as BodyActivity)
    ? (value as BodyActivity)
    : null;
}
