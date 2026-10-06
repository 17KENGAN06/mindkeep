import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { isMealKind } from '@/features/nutrition/mealKinds';
import type { Meal } from '@/types/nutrition';

type MealRowProps = {
  meal: Meal;
  busy: boolean;
  showMacros?: boolean;
  onDelete: (id: string) => void;
};

function formatGrams(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function MealRow({ meal, busy, showMacros = false, onDelete }: MealRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const kindLabel = isMealKind(meal.kind) ? t(`calories.kinds.${meal.kind}`) : null;

  useLayoutEffect(() => {
    const measure = () => {
      if (open) return;
      const el = lineRef.current;
      if (!el) return;
      setOverflows(el.scrollWidth > el.clientWidth + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, meal.title, kindLabel]);

  const expandable = overflows || open;
  const text = open ? (
    <span className="block">
      {kindLabel ? <span className="block text-sm font-semibold leading-snug text-ink">{kindLabel}</span> : null}
      <span
        className={`block leading-snug [overflow-wrap:anywhere] ${
          kindLabel ? 'mt-0.5 text-xs text-muted' : 'text-sm font-medium text-ink'
        }`}
      >
        {meal.title}
      </span>
    </span>
  ) : kindLabel ? (
    <p ref={lineRef} className="flex min-w-0 items-baseline gap-2">
      <span className="max-w-[42%] shrink-0 truncate text-sm font-semibold text-ink">{kindLabel}</span>
      <span className="min-w-0 truncate text-xs text-muted">{meal.title}</span>
    </p>
  ) : (
    <p ref={lineRef} className="truncate text-sm font-medium text-ink">
      {meal.title}
    </p>
  );

  const macros = [
    { label: t('calories.macros.proteinShort'), value: meal.protein },
    { label: t('calories.macros.fatShort'), value: meal.fat },
    { label: t('calories.macros.carbsShort'), value: meal.carbs },
  ].filter((item): item is { label: string; value: number } => item.value != null);

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-brand-50/40 px-3 py-3 ring-1 ring-line">
      <div className="min-w-0 flex-1">
        {expandable ? (
          <button
            type="button"
            className="w-full min-w-0 rounded-lg text-left touch-manipulation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {text}
          </button>
        ) : (
          text
        )}
        {showMacros && macros.length > 0 ? (
          <p className="mt-1 text-xs tabular-nums text-muted">
            {macros.map((item) => `${item.label} ${formatGrams(item.value)}`).join(' · ')}{' '}
            {t('calories.macros.grams')}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-sm tabular-nums whitespace-nowrap text-muted">
        {meal.calories} {t('calories.kcal')}
      </span>
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition touch-manipulation hover:bg-brand-50 hover:text-ink disabled:opacity-50 sm:h-10 sm:w-auto sm:px-3 sm:text-sm sm:font-semibold"
        disabled={busy}
        aria-label={t('common.delete')}
        onClick={() => onDelete(meal.id)}
      >
        <Trash2 className="h-4 w-4 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">{t('common.delete')}</span>
      </button>
    </li>
  );
}
