import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { MEAL_KINDS, type MealKind } from '@/features/nutrition/mealKinds';

type MealKindPickerProps = {
  value: MealKind | null;
  onChange: (kind: MealKind) => void;
  pro: boolean;
};

export function MealKindPicker({ value, onChange, pro }: MealKindPickerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">{t('calories.kinds.label')}</p>
        {!pro ? <Badge>Pro</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {MEAL_KINDS.map((kind) => {
          const selected = value === kind;
          return (
            <button
              key={kind}
              type="button"
              className={`min-h-10 rounded-full px-3 text-sm font-medium transition touch-manipulation ${
                selected
                  ? 'bg-brand-500 text-[#07110d]'
                  : 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
              } ${pro ? '' : 'opacity-70'}`}
              onClick={() => {
                if (!pro) {
                  navigate('/account');
                  return;
                }
                onChange(kind);
              }}
            >
              {t(`calories.kinds.${kind}`)}
            </button>
          );
        })}
      </div>
      {!pro ? <p className="text-xs text-muted">{t('calories.kinds.proHint')}</p> : null}
    </div>
  );
}
