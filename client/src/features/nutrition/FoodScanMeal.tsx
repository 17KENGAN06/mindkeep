import { Camera, Images, LoaderCircle } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { nutritionApi } from '@/api/nutrition';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { hasAutomation, mutationErrorMessage } from '@/features/billing/planLimit';
import { compressMealPhoto, MealPhotoError } from '@/features/nutrition/compressMealPhoto';
import { MealKindPicker } from '@/features/nutrition/MealKindPicker';
import type { MealKind } from '@/features/nutrition/mealKinds';
import { useCreateMeal } from '@/features/nutrition/useNutrition';
import { usePhoneViewport } from '@/features/nutrition/usePhoneViewport';

type ReviewState = {
  mealName: string;
  totalCalories: string;
  kind: MealKind | null;
};

function scanErrorMessage(error: unknown, t: (key: string) => string): string {
  const code =
    error instanceof MealPhotoError
      ? error.code
      : error instanceof ApiError
        ? error.code
        : null;

  switch (code) {
    case 'FOOD_SCAN_UNAVAILABLE':
      return t('calories.scan.errors.unavailable');
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('calories.scan.errors.proRequired');
    case 'FOOD_NOT_RECOGNIZED':
      return t('calories.scan.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('calories.scan.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('calories.scan.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('calories.scan.errors.invalid');
    case 'FOOD_SCAN_FAILED':
    case 'TIMEOUT':
      return t('calories.scan.errors.failed');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    default:
      return mutationErrorMessage(error, t);
  }
}

type FoodScanMealProps = {
  date: string;
};

export function FoodScanMeal({ date }: FoodScanMealProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const phone = usePhoneViewport();
  const createMeal = useCreateMeal();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const automation = hasAutomation(user);
  const canScan = phone && automation;

  const onNeedPro = () => {
    setError(null);
    navigate('/plans');
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setAnalyzing(true);
    try {
      const payload = await compressMealPhoto(file);
      const estimate = await nutritionApi.scanFood(payload);
      setReview({
        mealName: estimate.mealName,
        totalCalories: String(estimate.totalCalories),
        kind: null,
      });
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  const onConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!review) return;
    const calories = Number(review.totalCalories);
    if (!review.mealName.trim()) {
      setError(t('calories.errors.title'));
      return;
    }
    if (!Number.isFinite(calories) || calories < 1 || calories > 10000) {
      setError(t('calories.errors.calories'));
      return;
    }
    if (automation && !review.kind) {
      setError(t('calories.errors.kind'));
      return;
    }

    setError(null);
    try {
      await createMeal.mutateAsync({
        title: review.mealName.trim(),
        calories: Math.round(calories),
        date,
        ...(review.kind ? { kind: review.kind } : {}),
      });
      setReview(null);
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    }
  };

  const hint = !phone
    ? t('calories.scan.phoneOnly')
    : automation
      ? t('calories.scan.hint')
      : t('calories.scan.proOnly');

  return (
    <div className="space-y-3">
      {phone ? (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void onFile(event)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(event) => void onFile(event)}
          />
        </>
      ) : null}

      {canScan ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1 overflow-hidden rounded-xl bg-panel px-1.5 py-2 text-[13px] font-semibold leading-none text-ink ring-1 ring-line whitespace-nowrap touch-manipulation hover:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={analyzing}
            aria-busy={analyzing}
            onClick={() => {
              setError(null);
              cameraRef.current?.click();
            }}
          >
            {analyzing ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <>
                <Camera className="h-4 w-4 shrink-0" aria-hidden />
                {t('calories.scan.buttonShort')}
              </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1 overflow-hidden rounded-xl bg-panel px-1.5 py-2 text-[13px] font-semibold leading-none text-ink ring-1 ring-line whitespace-nowrap touch-manipulation hover:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={analyzing}
            onClick={() => {
              setError(null);
              galleryRef.current?.click();
            }}
          >
            <Images className="h-4 w-4 shrink-0" aria-hidden />
            {t('calories.scan.gallery')}
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={!phone}
          title={!phone ? t('calories.scan.phoneOnly') : undefined}
          onClick={phone ? onNeedPro : undefined}
        >
          <Camera className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {t('calories.scan.button')}
          <span className="ml-2">
            <Badge tone="neutral">{!phone ? t('calories.scan.phoneBadge') : 'Pro'}</Badge>
          </span>
        </Button>
      )}
      <p className="text-xs text-muted">{hint}</p>
      <ErrorMessage message={error ?? undefined} />

      {review ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-scan-review-title"
            className="w-full max-w-md space-y-4 rounded-2xl bg-panel p-5 shadow-lg"
            onSubmit={(event) => void onConfirm(event)}
          >
            <div>
              <h3 id="food-scan-review-title" className="text-lg font-semibold text-ink">
                {t('calories.scan.reviewTitle')}
              </h3>
              <p className="mt-1 text-sm text-muted">{t('calories.scan.reviewHint')}</p>
            </div>
            <MealKindPicker
              value={review.kind}
              pro={automation}
              onChange={(kind) => setReview({ ...review, kind })}
            />
            <Input
              label={t('calories.mealTitle')}
              value={review.mealName}
              onChange={(event) => setReview({ ...review, mealName: event.target.value })}
              autoComplete="off"
            />
            <Input
              label={t('calories.mealCalories')}
              type="number"
              min="1"
              max="10000"
              value={review.totalCalories}
              onChange={(event) => setReview({ ...review, totalCalories: event.target.value })}
            />
            <p className="text-xs text-muted">{t('calories.scan.privacy')}</p>
            <ErrorMessage message={error ?? undefined} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReview(null)}
                disabled={createMeal.isPending}
              >
                {t('calories.scan.cancel')}
              </Button>
              <Button type="submit" isLoading={createMeal.isPending}>
                {t('calories.scan.add')}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
