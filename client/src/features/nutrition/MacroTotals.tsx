import { useTranslation } from 'react-i18next';
import type { Meal } from '@/types/nutrition';

export type MacroSums = {
  protein: number;
  fat: number;
  carbs: number;
  tracked: number;
};

export function sumMealMacros(meals: Meal[]): MacroSums {
  return meals.reduce<MacroSums>(
    (totals, meal) => {
      const logged = meal.protein != null || meal.fat != null || meal.carbs != null;
      return {
        protein: totals.protein + (meal.protein ?? 0),
        fat: totals.fat + (meal.fat ?? 0),
        carbs: totals.carbs + (meal.carbs ?? 0),
        tracked: totals.tracked + (logged ? 1 : 0),
      };
    },
    { protein: 0, fat: 0, carbs: 0, tracked: 0 },
  );
}

function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

type MacroTotalsProps = {
  meals: Meal[];
};

export function MacroTotals({ meals }: MacroTotalsProps) {
  const { t } = useTranslation();
  const totals = sumMealMacros(meals);
  const cards = [
    { label: t('calories.macros.protein'), value: totals.protein },
    { label: t('calories.macros.fat'), value: totals.fat },
    { label: t('calories.macros.carbs'), value: totals.carbs },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-brand-50/40 p-3 ring-1 ring-line">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{card.label}</p>
            <p className="mt-1 text-sm font-semibold text-ink sm:text-base">
              {formatGrams(card.value)} {t('calories.macros.grams')}
            </p>
          </div>
        ))}
      </div>
      {meals.length > 0 && totals.tracked < meals.length ? (
        <p className="text-xs text-muted">
          {t('calories.macros.partial', { tracked: totals.tracked, total: meals.length })}
        </p>
      ) : null}
    </div>
  );
}
