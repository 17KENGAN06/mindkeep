import { Camera, Images, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { nutritionApi } from '@/api/nutrition';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { ScanDropZone } from '@/components/ui/ScanDropZone';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { hasAutomation, mutationErrorMessage } from '@/features/billing/planLimit';
import { compressMealPhoto, MealPhotoError } from '@/features/nutrition/compressMealPhoto';
import { MealKindPicker } from '@/features/nutrition/MealKindPicker';
import type { MealKind } from '@/features/nutrition/mealKinds';
import { useCreateMeal } from '@/features/nutrition/useNutrition';
import { usePhoneViewport } from '@/features/nutrition/usePhoneViewport';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

const MAX_PHOTOS = 3;

type ReviewState = {
  mealName: string;
  totalCalories: string;
  kind: MealKind | null;
};

type PickedPhoto = {
  id: string;
  file: File;
  preview: string;
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
  const [preparing, setPreparing] = useState(false);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const automation = hasAutomation(user);
  const canScan = automation;
  useLockBodyScroll(preparing || review !== null);

  const photosRef = useRef<PickedPhoto[]>([]);
  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  const clearPhotos = (next: PickedPhoto[] = []) => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setPhotos(next);
  };

  const closePrepare = () => {
    clearPhotos();
    setNote('');
    setPreparing(false);
  };

  const onNeedPro = () => {
    setError(null);
    navigate('/plans');
  };

  const openPrepare = () => {
    setError(null);
    setPreparing(true);
  };

  const addFiles = (list: File[]) => {
    const incoming = list
      .filter((file) => !file.type || file.type.startsWith('image/'))
      .map(
        (file) =>
          new File([file], file.name || 'photo.jpg', {
            type: file.type || 'image/jpeg',
            lastModified: file.lastModified,
          }),
      );
    if (incoming.length === 0) return;
    setError(null);
    setPhotos((current) => {
      const room = MAX_PHOTOS - current.length;
      const added = incoming.slice(0, room).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      return [...current, ...added];
    });
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length > 0) addFiles(files);
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const victim = current.find((photo) => photo.id === id);
      if (victim) URL.revokeObjectURL(victim.preview);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const canEstimate = photos.length > 0 || note.trim().length >= 2;

  const onEstimate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEstimate) {
      setError(t('calories.scan.prepareNeedPhoto'));
      return;
    }

    setError(null);
    setAnalyzing(true);
    try {
      const images =
        photos.length > 0
          ? await Promise.all(photos.map((photo) => compressMealPhoto(photo.file)))
          : [];
      const trimmed = note.trim();
      const estimate = await nutritionApi.scanFood({
        ...(images.length > 0 ? { images } : {}),
        ...(trimmed ? { note: trimmed.slice(0, 240) } : {}),
      });
      setReview({
        mealName: estimate.mealName,
        totalCalories: String(estimate.totalCalories),
        kind: null,
      });
      closePrepare();
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

  const hint = automation
    ? phone
      ? t('calories.scan.hint')
      : t('calories.scan.desktopHint')
    : t('calories.scan.proOnly');

  return (
    <div className="space-y-3">
      <>
          {phone ? (
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={onFileInput}
            />
          ) : null}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onFileInput}
          />
        </>

      {canScan ? (
        phone ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1 overflow-hidden rounded-xl bg-panel px-1.5 py-2 text-[13px] font-semibold leading-none text-ink ring-1 ring-line whitespace-nowrap touch-manipulation hover:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={analyzing}
            aria-busy={analyzing}
            onClick={openPrepare}
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
            onClick={openPrepare}
          >
            <Images className="h-4 w-4 shrink-0" aria-hidden />
            {t('calories.scan.gallery')}
          </button>
        </div>
        ) : (
          <Button type="button" variant="secondary" className="w-full" disabled={analyzing} onClick={openPrepare}>
            <Images className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {t('calories.scan.button')}
          </Button>
        )
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onNeedPro}
        >
          <Camera className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {t('calories.scan.button')}
          <span className="ml-2">
            <Badge tone="neutral">Pro</Badge>
          </span>
        </Button>
      )}
      <p className="text-xs text-muted">{hint}</p>
      <ErrorMessage message={!preparing && !review ? error ?? undefined : undefined} />

      {preparing
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 overscroll-none sm:items-center">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-scan-prepare-title"
            className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
            onSubmit={(event) => void onEstimate(event)}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5">
            <div>
              <h3 id="food-scan-prepare-title" className="text-lg font-semibold text-ink">
                {t('calories.scan.prepareTitle')}
              </h3>
              <p className="mt-1 text-sm text-muted">{t('calories.scan.prepareLead')}</p>
            </div>
            <Textarea
              label={t('calories.scan.prepareLabel')}
              hint={t('calories.scan.prepareOptional')}
              placeholder={t('calories.scan.preparePlaceholder')}
              rows={3}
              maxLength={240}
              className="min-h-20"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div>
              <p className="text-sm font-medium text-ink">{t('calories.scan.preparePhotos')}</p>
              <p className="mt-1 text-xs text-muted">{t('calories.scan.preparePhotosHint')}</p>
              {photos.length > 0 ? (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <li key={photo.id} className="relative">
                      <img
                        src={photo.preview}
                        alt=""
                        className="h-20 w-full rounded-xl object-cover ring-1 ring-line"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white"
                        aria-label={t('calories.scan.removePhoto')}
                        onClick={() => removePhoto(photo.id)}
                        disabled={analyzing}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="sr-only">
                        {t('calories.scan.prepareCount', { count: index + 1 })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {photos.length < MAX_PHOTOS ? (
                phone ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={analyzing}
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                    {t('calories.scan.prepareCamera')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={analyzing}
                    onClick={() => galleryRef.current?.click()}
                  >
                    <Images className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                    {t('calories.scan.prepareGallery')}
                  </Button>
                </div>
                ) : (
                  <div className="mt-3">
                    <ScanDropZone
                      label={t('calories.scan.prepareUpload')}
                      hint={t('calories.scan.prepareDrop')}
                      disabled={analyzing}
                      onPick={() => galleryRef.current?.click()}
                      onFiles={addFiles}
                    />
                  </div>
                )
              ) : (
                <p className="mt-2 text-xs text-muted">{t('calories.scan.prepareCount', { count: photos.length })}</p>
              )}
            </div>
            <p className="text-xs text-muted">{t('calories.scan.privacy')}</p>
            <ErrorMessage message={error ?? undefined} />
            </div>
            <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closePrepare} disabled={analyzing}>
                {t('calories.scan.cancel')}
              </Button>
              <Button type="submit" isLoading={analyzing} disabled={!canEstimate}>
                {t('calories.scan.prepareSubmit')}
              </Button>
            </div>
          </form>
        </div>,
        document.body,
      )
      : null}

      {review
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 overscroll-none sm:items-center">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-scan-review-title"
            className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
            onSubmit={(event) => void onConfirm(event)}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
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
            </div>
            <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
        </div>,
        document.body,
      )
      : null}
    </div>
  );
}
