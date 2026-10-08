// Same list as the site (client/src/features/nutrition/mealKinds.ts) and the server.
export const MEAL_KINDS = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'] as const;

export type MealKind = (typeof MEAL_KINDS)[number];

export function isMealKind(value: string | null | undefined): value is MealKind {
  return Boolean(value && (MEAL_KINDS as readonly string[]).includes(value));
}
