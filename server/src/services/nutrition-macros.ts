export type MacroGrams = {
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export type MacroTotals = {
  protein: number;
  fat: number;
  carbs: number;
};

const MACRO_MAX = 2000;

export function roundMacro(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  const rounded = Math.round(Math.min(value, MACRO_MAX) * 10) / 10;
  return rounded === 0 ? 0 : rounded;
}

export function emptyMacroTotals(): MacroTotals {
  return { protein: 0, fat: 0, carbs: 0 };
}

export function addMacros(totals: MacroTotals, meal: Partial<MacroGrams>): MacroTotals {
  return {
    protein: totals.protein + (meal.protein ?? 0),
    fat: totals.fat + (meal.fat ?? 0),
    carbs: totals.carbs + (meal.carbs ?? 0),
  };
}

export function roundMacroTotals(totals: MacroTotals): MacroTotals {
  return {
    protein: Math.round(totals.protein * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
  };
}

export function hasMacros(meal: Partial<MacroGrams>): boolean {
  return meal.protein != null || meal.fat != null || meal.carbs != null;
}
