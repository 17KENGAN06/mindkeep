import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import { useEstimateCalories } from '@/features/nutrition/useNutrition';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import type {
  BodyActivity,
  BodySex,
  CalorieEstimate,
  NutritionSettings,
} from '@/types/nutrition';

const ACTIVITIES: BodyActivity[] = ['sedentary', 'light', 'moderate', 'high', 'athlete'];

type Draft = {
  sex: BodySex | '';
  age: string;
  heightCm: string;
  weightKg: string;
  activity: BodyActivity | '';
  targetWeightKg: string;
};

type CalorieHelperDialogProps = {
  open: boolean;
  settings: NutritionSettings;
  currentWeightKg: number | null;
  applying: boolean;
  onClose: () => void;
  onApply: (calories: number, targetWeightKg: number) => void;
};

function emptyDraft(settings: NutritionSettings, currentWeightKg: number | null): Draft {
  return {
    sex: settings.bodySex ?? '',
    age: settings.bodyAge == null ? '' : String(settings.bodyAge),
    heightCm: settings.bodyHeightCm == null ? '' : String(settings.bodyHeightCm),
    weightKg: currentWeightKg == null ? '' : String(currentWeightKg),
    activity: settings.bodyActivity ?? '',
    targetWeightKg: settings.weightGoal == null ? '' : String(settings.weightGoal),
  };
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function CalorieHelperDialog({
  open,
  settings,
  currentWeightKg,
  applying,
  onClose,
  onApply,
}: CalorieHelperDialogProps) {
  const { t } = useTranslation();
  const estimateCalories = useEstimateCalories();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(settings, currentWeightKg));
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyDraft(settings, currentWeightKg));
    setEstimate(null);
    setAcknowledged(false);
    setError(null);
  }, [open, settings, currentWeightKg]);

  if (!open) return null;

  // A result must never outlive the numbers it came from.
  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setEstimate(null);
    setAcknowledged(false);
    setError(null);
  };

  const onCalculate = async (event: FormEvent) => {
    event.preventDefault();
    const age = parseNumber(draft.age);
    const heightCm = parseNumber(draft.heightCm);
    const weightKg = parseNumber(draft.weightKg);
    const targetWeightKg = parseNumber(draft.targetWeightKg);

    if (
      !draft.sex ||
      !draft.activity ||
      age == null ||
      age < 10 ||
      age > 120 ||
      heightCm == null ||
      heightCm < 80 ||
      heightCm > 250 ||
      weightKg == null ||
      weightKg < 20 ||
      weightKg > 400 ||
      targetWeightKg == null ||
      targetWeightKg < 20 ||
      targetWeightKg > 400
    ) {
      setError(t('calories.helper.errors.invalid'));
      return;
    }

    setError(null);
    try {
      const result = await estimateCalories.mutateAsync({
        sex: draft.sex,
        activity: draft.activity,
        age: Math.round(age),
        heightCm: Math.round(heightCm),
        weightKg,
        targetWeightKg,
      });
      setEstimate(result.estimate);
      setAcknowledged(false);
    } catch (caught) {
      setError(mutationErrorMessage(caught, t));
    }
  };

  const modeLabel = estimate
    ? t(
        estimate.mode === 'lose'
          ? 'calories.helper.modeLose'
          : estimate.mode === 'gain'
            ? 'calories.helper.modeGain'
            : 'calories.helper.modeHold',
      )
    : '';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 overscroll-none sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="calorie-helper-title"
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
        onSubmit={(event) => void onCalculate(event)}
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1">
          <div>
            <h3 id="calorie-helper-title" className="text-lg font-semibold text-ink">
              {t('calories.helper.title')}
            </h3>
            <p className="mt-1 text-sm text-muted">{t('calories.helper.lead')}</p>
          </div>

          <Select
            label={t('calories.helper.sex')}
            variant="panel"
            value={draft.sex}
            options={[
              { value: 'female', label: t('calories.helper.sexFemale') },
              { value: 'male', label: t('calories.helper.sexMale') },
            ]}
            onChange={(event) => edit({ sex: event.target.value as BodySex })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('calories.helper.age')}
              type="number"
              min="10"
              max="120"
              inputMode="numeric"
              autoComplete="off"
              value={draft.age}
              onChange={(event) => edit({ age: event.target.value })}
            />
            <Input
              label={t('calories.helper.height')}
              type="number"
              min="80"
              max="250"
              inputMode="numeric"
              autoComplete="off"
              value={draft.heightCm}
              onChange={(event) => edit({ heightCm: event.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('calories.helper.weight')}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draft.weightKg}
              onChange={(event) => edit({ weightKg: event.target.value })}
            />
            <Input
              label={t('calories.helper.target')}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draft.targetWeightKg}
              onChange={(event) => edit({ targetWeightKg: event.target.value })}
            />
          </div>

          <Select
            label={t('calories.helper.activity')}
            variant="menu"
            value={draft.activity}
            placeholder={t('calories.helper.activityPlaceholder')}
            options={ACTIVITIES.map((activity) => ({
              value: activity,
              label: t(`calories.helper.activityLevels.${activity}`),
            }))}
            onChange={(event) => edit({ activity: event.target.value as BodyActivity })}
          />

          {estimate ? (
            <div className="space-y-3 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-line">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                  {t('calories.helper.result')}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {estimate.calories} {t('calories.kcal')}
                </p>
                <p className="mt-1 text-sm text-muted">{modeLabel}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted">{t('calories.helper.maintenance')}</dt>
                  <dd className="font-semibold text-ink">
                    {estimate.maintenance} {t('calories.kcal')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{t('calories.helper.bmi')}</dt>
                  <dd className="font-semibold text-ink">{estimate.targetBmi}</dd>
                </div>
              </dl>
              {estimate.notes.length > 0 ? (
                <ul className="space-y-1.5">
                  {estimate.notes.map((note) => (
                    <li key={note} className="text-sm font-medium text-expense">
                      {t(`calories.helper.notes.${note}`)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs leading-relaxed text-muted">{t('calories.helper.disclaimer')}</p>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand-500"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>{t('calories.helper.ack')}</span>
              </label>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">{t('calories.helper.disclaimer')}</p>
          )}

          <ErrorMessage message={error ?? undefined} />
        </div>

        <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={estimateCalories.isPending || applying}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant={estimate ? 'secondary' : 'primary'} isLoading={estimateCalories.isPending}>
            {estimate ? t('calories.helper.recalculate') : t('calories.helper.calculate')}
          </Button>
          {estimate ? (
            <Button
              type="button"
              isLoading={applying}
              disabled={!acknowledged}
              onClick={() => onApply(estimate.calories, estimate.targetWeightKg)}
            >
              {t('calories.helper.apply')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>,
    document.body,
  );
}
