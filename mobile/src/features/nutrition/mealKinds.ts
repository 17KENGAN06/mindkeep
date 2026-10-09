// Same list as the site (client/src/features/nutrition/mealKinds.ts) and the server.
export const MEAL_KINDS = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'] as const;

export type MealKind = (typeof MEAL_KINDS)[number];

/** A sensible default by the time of day (still editable): breakfast, lunch, dinner, snack. */
export function suggestMealKind(at = new Date()): MealKind {
  const hour = at.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

export function isMealKind(value: string | null | undefined): value is MealKind {
  return Boolean(value && (MEAL_KINDS as readonly string[]).includes(value));
}
