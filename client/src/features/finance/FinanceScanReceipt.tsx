import { Banknote, Camera, Images, LoaderCircle, WalletCards, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { financeApi } from '@/api/finance';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { ScanDropZone } from '@/components/ui/ScanDropZone';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { hasAutomation, mutationErrorMessage } from '@/features/billing/planLimit';
import { currencyOptions, isFinanceCurrency, type FinanceCurrency } from '@/features/finance/currencies';
import { compressMealPhoto, MealPhotoError } from '@/features/nutrition/compressMealPhoto';
import { usePhoneViewport } from '@/features/nutrition/usePhoneViewport';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import type { AppLanguage } from '@/i18n';
import type { FinanceCategory, FinanceDraftOperation, FinanceMoneyKind } from '@/types/finance';

type ReviewRow = FinanceDraftOperation & { categoryId: string };

function scanErrorMessage(error: unknown, t: (key: string) => string): string {
  const code =
    error instanceof MealPhotoError
      ? error.code
      : error instanceof ApiError
        ? error.code
        : null;

  switch (code) {
    case 'FINANCE_SCAN_UNAVAILABLE':
    case 'FOOD_SCAN_UNAVAILABLE':
      return t('finance.scan.errors.unavailable');
    case 'FINANCE_IMPORT_PRO_REQUIRED':
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('finance.scan.errors.proRequired');
    case 'FINANCE_SCAN_EMPTY':
      return t('finance.scan.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('finance.scan.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('finance.scan.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('finance.scan.errors.invalid');
    case 'FINANCE_SCAN_FAILED':
    case 'FOOD_SCAN_FAILED':
    case 'TIMEOUT':
      return t('finance.scan.errors.failed');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    default:
      return mutationErrorMessage(error, t);
  }
}

type FinanceScanReceiptProps = {
  language: AppLanguage;
  fallbackCurrency: FinanceCurrency;
  defaultMoneyKind: FinanceMoneyKind;
  categories: FinanceCategory[];
  isSaving?: boolean;
  onSave: (operations: FinanceDraftOperation[]) => Promise<void>;
};

export function FinanceScanReceipt({
  language,
  fallbackCurrency,
  defaultMoneyKind,
  categories,
  isSaving = false,
  onSave,
}: FinanceScanReceiptProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const phone = usePhoneViewport();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [picked, setPicked] = useState<{ file: File; preview: string } | null>(null);
  const [review, setReview] = useState<ReviewRow[] | null>(null);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchMoneyKind, setBatchMoneyKind] = useState<FinanceMoneyKind>(defaultMoneyKind);
  const automation = hasAutomation(user);
  const canScan = automation;
  useLockBodyScroll(preparing || review !== null);

  const closePrepare = () => {
    if (picked) URL.revokeObjectURL(picked.preview);
    setPicked(null);
    setPreparing(false);
  };

  const onNeedPro = () => {
    setError(null);
    void navigate('/plans');
  };

  const setPickedFile = (file: File) => {
    const copied = new File([file], file.name || 'photo.jpg', { type: file.type || 'image/jpeg' });
    setPicked((current) => {
      if (current) URL.revokeObjectURL(current.preview);
      return { file: copied, preview: URL.createObjectURL(copied) };
    });
    setError(null);
  };

  const analyzeFile = async (file: File) => {
    const copied = new File([file], file.name || 'photo.jpg', { type: file.type || 'image/jpeg' });
    setError(null);
    setAnalyzing(true);
    try {
      const payload = await compressMealPhoto(copied);
      const result = await financeApi.scanStatement({ ...payload, fallbackCurrency });
      setBatchCategory('');
      setBatchMoneyKind(defaultMoneyKind);
      setReview(
        result.operations.map((row) => ({
          date: row.date,
          amount: row.amount,
          currency: isFinanceCurrency(row.currency ?? '') ? row.currency! : fallbackCurrency,
          type: row.type,
          moneyKind: defaultMoneyKind,
          comment: row.comment ?? '',
          categoryId: '',
        })),
      );
      closePrepare();
    } catch (caught) {
      setReview(null);
      setError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ? event.target.files[0] : null;
    event.target.value = '';
    if (!file) return;
    if (preparing) {
      setPickedFile(file);
      return;
    }
    void analyzeFile(file);
  };

  const onPrepareSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!picked) {
      setError(t('finance.scan.errors.invalid'));
      return;
    }
    void analyzeFile(picked.file);
  };

  const onConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!review || review.length === 0) return;
    const invalid = review.some(
      (row) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(row.amount) || row.amount <= 0,
    );
    if (invalid) {
      setError(t('finance.errors.amount'));
      return;
    }
    setError(null);
    try {
      await onSave(
        review.map((row) => ({
          date: row.date,
          amount: row.amount,
          currency: row.currency,
          type: row.type,
          moneyKind: batchMoneyKind,
          comment: row.comment.trim(),
          categoryId: row.categoryId || null,
        })),
      );
      setReview(null);
      setBatchCategory('');
      setBatchMoneyKind(defaultMoneyKind);
    } catch (caught) {
      setError(scanErrorMessage(caught, t));
    }
  };

  const patchRow = (index: number, patch: Partial<ReviewRow>) => {
    setReview(
      (rows) => rows?.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) ?? null,
    );
  };

  const hint = automation
    ? phone
      ? t('finance.scan.hint')
      : t('finance.scan.desktopHint')
    : t('finance.scan.proOnly');

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
              onChange={onFile}
            />
          ) : null}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFile}
          />
        </>

      {canScan ? (
        phone ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1 overflow-hidden rounded-xl bg-surface px-1.5 py-2 text-[13px] font-semibold leading-none text-ink ring-1 ring-line whitespace-nowrap touch-manipulation hover:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                {t('finance.scan.buttonShort')}
              </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1 overflow-hidden rounded-xl bg-surface px-1.5 py-2 text-[13px] font-semibold leading-none text-ink ring-1 ring-line whitespace-nowrap touch-manipulation hover:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={analyzing}
            onClick={() => {
              setError(null);
              galleryRef.current?.click();
            }}
          >
            <Images className="h-4 w-4 shrink-0" aria-hidden />
            {t('finance.scan.gallery')}
          </button>
        </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={analyzing}
            onClick={() => {
              setError(null);
              setPreparing(true);
            }}
          >
            <Images className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {t('finance.scan.button')}
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
          {t('finance.scan.button')}
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
                aria-labelledby="finance-scan-prepare-title"
                className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
                onSubmit={onPrepareSubmit}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1">
                  <div>
                    <h3 id="finance-scan-prepare-title" className="text-lg font-semibold text-ink">
                      {t('finance.scan.prepareTitle')}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{t('finance.scan.prepareLead')}</p>
                  </div>
                  {picked ? (
                    <div className="relative">
                      <img
                        src={picked.preview}
                        alt=""
                        className="h-44 w-full rounded-2xl object-cover ring-1 ring-line"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white"
                        aria-label={t('finance.scan.removePhoto')}
                        onClick={() => {
                          URL.revokeObjectURL(picked.preview);
                          setPicked(null);
                        }}
                        disabled={analyzing}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <ScanDropZone
                      label={t('finance.scan.prepareUpload')}
                      hint={t('finance.scan.prepareDrop')}
                      disabled={analyzing}
                      onPick={() => galleryRef.current?.click()}
                      onFiles={(files) => {
                        const file = files.find((item) => !item.type || item.type.startsWith('image/'));
                        if (file) setPickedFile(file);
                      }}
                    />
                  )}
                  <p className="text-xs text-muted">{t('finance.scan.privacy')}</p>
                  <ErrorMessage message={error ?? undefined} />
                </div>
                <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={closePrepare} disabled={analyzing}>
                    {t('finance.scan.cancel')}
                  </Button>
                  <Button type="submit" isLoading={analyzing} disabled={!picked}>
                    {t('finance.scan.prepareSubmit')}
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
            aria-labelledby="finance-scan-review-title"
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
            onSubmit={(event) => void onConfirm(event)}
          >
            <div className="shrink-0">
              <h3 id="finance-scan-review-title" className="text-lg font-semibold text-ink">
                {t('finance.scan.reviewTitle')}
              </h3>
              <p className="mt-1 text-sm text-muted">{t('finance.scan.reviewHint')}</p>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1">
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">{t('finance.scan.moneyKind')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'CASH' as const, label: t('finance.moneyKind.cash'), Icon: Banknote },
                      { value: 'ELECTRONIC' as const, label: t('finance.scan.card'), Icon: WalletCards },
                    ] as const
                  ).map(({ value, label, Icon }) => {
                    const selected = batchMoneyKind === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium transition touch-manipulation ${
                          selected
                            ? 'bg-brand-500 text-[#07110d]'
                            : 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
                        }`}
                        onClick={() => {
                          setBatchMoneyKind(value);
                          setReview((rows) => rows?.map((row) => ({ ...row, moneyKind: value })) ?? null);
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Select
                label={t('finance.scan.category')}
                value={batchCategory}
                placeholder={t('finance.noCategory')}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                onChange={(event) => {
                  const next = event.target.value;
                  setBatchCategory(next);
                  setReview((rows) => rows?.map((row) => ({ ...row, categoryId: next })) ?? null);
                }}
              />

              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {review.map((row, index) => (
                    <li key={`${row.date}-${index}`} className="min-w-0 space-y-3 px-3 py-3">
                      <Textarea
                        label={t('finance.scan.item')}
                        value={row.comment}
                        rows={2}
                        maxLength={500}
                        className="min-h-16 resize-y"
                        onChange={(event) => patchRow(index, { comment: event.target.value })}
                      />
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          label={t('finance.amount')}
                          type="number"
                          min="0.01"
                          step="0.01"
                          inputMode="decimal"
                          value={Number.isFinite(row.amount) ? String(row.amount) : ''}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            patchRow(index, {
                              amount: Number.isFinite(next) ? next : 0,
                            });
                          }}
                        />
                        <Input
                          label={t('finance.date')}
                          type="date"
                          value={row.date}
                          onChange={(event) => patchRow(index, { date: event.target.value })}
                        />
                      </div>
                      <Select
                        label={t('finance.type')}
                        value={row.type}
                        options={[
                          { value: 'EXPENSE', label: t('finance.expense') },
                          { value: 'INCOME', label: t('finance.income') },
                        ]}
                        onChange={(event) =>
                          patchRow(index, { type: event.target.value as ReviewRow['type'] })
                        }
                      />
                      <Select
                        label={t('finance.currency')}
                        value={row.currency}
                        options={currencyOptions(language)}
                        onChange={(event) => {
                          const next = event.target.value as FinanceCurrency;
                          patchRow(index, { currency: next });
                        }}
                      />
                      {review.length > 1 ? (
                        <Select
                          label={t('finance.category')}
                          value={row.categoryId}
                          placeholder={t('finance.noCategory')}
                          options={categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                          }))}
                          onChange={(event) => patchRow(index, { categoryId: event.target.value })}
                        />
                      ) : null}
                    </li>
                ))}
              </ul>
              <p className="text-xs text-muted">{t('finance.scan.privacy')}</p>
            </div>

            <ErrorMessage message={error ?? undefined} />
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setReview(null);
                  setError(null);
                }}
                disabled={isSaving}
              >
                {t('finance.scan.cancel')}
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {t('finance.scan.add')}
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
