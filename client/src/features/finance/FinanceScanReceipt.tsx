import { Banknote, Camera, Images, LoaderCircle, WalletCards } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { financeApi } from '@/api/finance';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/features/auth/useAuth';
import { hasAutomation, mutationErrorMessage } from '@/features/billing/planLimit';
import { currencyOptions, isFinanceCurrency, type FinanceCurrency } from '@/features/finance/currencies';
import { formatSignedMoney } from '@/features/finance/financeUtils';
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
  const [review, setReview] = useState<ReviewRow[] | null>(null);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchMoneyKind, setBatchMoneyKind] = useState<FinanceMoneyKind>(defaultMoneyKind);
  const automation = hasAutomation(user);
  const canScan = phone && automation;
  useLockBodyScroll(review !== null);

  const onNeedPro = () => {
    setError(null);
    void navigate('/plans');
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ? event.target.files[0] : null;
    const copied = file ? new File([file], file.name || 'photo.jpg', { type: file.type || 'image/jpeg' }) : null;
    event.target.value = '';
    if (!copied) return;

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
    } catch (caught) {
      setReview(null);
      setError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  const onConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!review || review.length === 0) return;
    setError(null);
    try {
      await onSave(
        review.map((row) => ({
          date: row.date,
          amount: row.amount,
          currency: row.currency,
          type: row.type,
          moneyKind: batchMoneyKind,
          comment: row.comment,
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

  const hint = !phone
    ? t('finance.scan.phoneOnly')
    : automation
      ? t('finance.scan.hint')
      : t('finance.scan.proOnly');

  return (
    <div className="space-y-3">
      {phone ? (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void onFile(event)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void onFile(event)}
          />
        </>
      ) : null}

      {canScan ? (
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
          variant="ghost"
          className="w-full"
          disabled={!phone}
          title={!phone ? t('finance.scan.phoneOnly') : undefined}
          onClick={phone ? onNeedPro : undefined}
        >
          <Camera className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {t('finance.scan.button')}
          <span className="ml-2">
            <Badge tone="neutral">{!phone ? t('finance.scan.phoneBadge') : 'Pro'}</Badge>
          </span>
        </Button>
      )}
      <p className="text-xs text-muted">{hint}</p>
      <ErrorMessage message={review ? undefined : error ?? undefined} />

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

            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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

              <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
                {review.map((row, index) => {
                  const signed = row.type === 'EXPENSE' ? -row.amount : row.amount;
                  return (
                    <li key={`${row.date}-${index}`} className="space-y-2 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium text-ink">
                          {row.comment || t('finance.noComment')}
                        </p>
                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            row.type === 'EXPENSE' ? 'text-expense' : 'text-brand-500'
                          }`}
                        >
                          {formatSignedMoney(signed, language, row.currency)}
                        </p>
                      </div>
                      <p className="text-xs text-muted">{row.date}</p>
                      <Select
                        label={t('finance.currency')}
                        value={row.currency}
                        options={currencyOptions(language)}
                        onChange={(event) => {
                          const next = event.target.value as FinanceCurrency;
                          setReview((rows) =>
                            rows?.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, currency: next } : item,
                            ) ?? null,
                          );
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
                          onChange={(event) => {
                            const next = event.target.value;
                            setReview((rows) =>
                              rows?.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, categoryId: next } : item,
                              ) ?? null,
                            );
                          }}
                        />
                      ) : null}
                    </li>
                  );
                })}
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
