export type MacroDraft = { protein: string; fat: string; carbs: string };

export const emptyMacroDraft: MacroDraft = { protein: '', fat: '', carbs: '' };

export function macroDraftFrom(values: {
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
}): MacroDraft {
  return {
    protein: values.protein == null ? '' : String(values.protein),
    fat: values.fat == null ? '' : String(values.fat),
    carbs: values.carbs == null ? '' : String(values.carbs),
  };
}

function parseGrams(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2000) return 'invalid';
  return Math.round(parsed * 10) / 10;
}

/** Returns null when any field holds something that is not a sane gram amount. */
export function parseMacroDraft(draft: MacroDraft) {
  const protein = parseGrams(draft.protein);
  const fat = parseGrams(draft.fat);
  const carbs = parseGrams(draft.carbs);
  if (protein === 'invalid' || fat === 'invalid' || carbs === 'invalid') return null;
  return { protein, fat, carbs };
}
