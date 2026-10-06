import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';

export type MacroDraft = {
  protein: string;
  fat: string;
  carbs: string;
};

export type MacroValues = {
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export function emptyMacroDraft(): MacroDraft {
  return { protein: '', fat: '', carbs: '' };
}

export function macroDraftFrom(values: Partial<MacroValues>): MacroDraft {
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
export function parseMacroDraft(draft: MacroDraft): MacroValues | null {
  const protein = parseGrams(draft.protein);
  const fat = parseGrams(draft.fat);
  const carbs = parseGrams(draft.carbs);
  if (protein === 'invalid' || fat === 'invalid' || carbs === 'invalid') return null;
  return { protein, fat, carbs };
}

type MealMacrosFieldsProps = {
  value: MacroDraft;
  idPrefix: string;
  onChange: (next: MacroDraft) => void;
};

export function MealMacrosFields({ value, idPrefix, onChange }: MealMacrosFieldsProps) {
  const { t } = useTranslation();
  const fields: Array<{ key: keyof MacroDraft; label: string }> = [
    { key: 'protein', label: t('calories.macros.protein') },
    { key: 'fat', label: t('calories.macros.fat') },
    { key: 'carbs', label: t('calories.macros.carbs') },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map((field) => (
        <Input
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          label={field.label}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('calories.macros.gramsShort')}
          value={value[field.key]}
          onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
        />
      ))}
    </div>
  );
}
