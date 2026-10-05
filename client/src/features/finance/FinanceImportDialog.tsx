import { Camera, Images, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { financeApi } from '@/api/finance';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Textarea } from '@/components/ui/Textarea';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import type { FinanceCurrency } from '@/features/finance/currencies';
import { formatSignedMoney } from '@/features/finance/financeUtils';
import {
  parseFinanceImport,
  type FinanceDraftOperation,
} from '@/features/finance/parseFinanceImport';
import { compressMealPhoto, MealPhotoError } from '@/features/nutrition/compressMealPhoto';
import type { AppLanguage } from '@/i18n';
import type { FinanceCategory } from '@/types/finance';

type Tab = 'paste' | 'photo';

type FinanceImportDialogProps = {
  open: boolean;
  language: AppLanguage;
  fallbackCurrency: FinanceCurrency;
  categories: FinanceCategory[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onImport: (operations: FinanceDraftOperation[]) => void;
};

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
      return t('finance.import.errors.unavailable');
    case 'FINANCE_IMPORT_PRO_REQUIRED':
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('finance.import.errors.proRequired');
    case 'FINANCE_SCAN_EMPTY':
      return t('finance.import.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('finance.import.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('finance.import.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('finance.import.errors.invalid');
    case 'FINANCE_SCAN_FAILED':
    case 'FOOD_SCAN_FAILED':
    case 'TIMEOUT':
      return t('finance.import.errors.failed');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    default:
      return mutationErrorMessage(error, t);
  }
}

export function FinanceImportDialog({
  open,
  language,
  fallbackCurrency,
  categories,
  isLoading = false,
  error,
  onClose,
  onImport,
}: FinanceImportDialogProps) {
  const { t } = useTranslation();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('paste');
  const [text, setText] = useState('');
  const [scanned, setScanned] = useState<FinanceDraftOperation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab('paste');
    setText('');
    setScanned([]);
    setAnalyzing(false);
    setScanError(null);
  }, [open]);

  const parsed = useMemo(
    () => (tab === 'paste' ? parseFinanceImport(text, fallbackCurrency) : { rows: scanned, skipped: 0 }),
    [tab, text, scanned, fallbackCurrency],
  );

  if (!open) return null;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setScanError(null);
    setAnalyzing(true);
    try {
      const payload = await compressMealPhoto(file);
      const result = await financeApi.scanStatement(payload);
      setScanned(
        result.operations.map((row) => ({
          date: row.date,
          amount: row.amount,
          currency: (row.currency ?? fallbackCurrency) as FinanceCurrency,
          type: row.type,
          moneyKind: row.moneyKind ?? 'ELECTRONIC',
          comment: row.comment ?? '',
        })),
      );
    } catch (caught) {
      setScanned([]);
      setScanError(scanErrorMessage(caught, t));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-import-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-panel p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (parsed.rows.length === 0 || isLoading || analyzing) return;
          onImport(parsed.rows);
        }}
      >
        <div className="shrink-0">
          <h2 id="finance-import-title" className="text-lg font-semibold text-ink">
            {t('finance.import.title')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('finance.import.hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['paste', 'photo'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`min-h-10 whitespace-nowrap rounded-full px-3 text-sm font-medium transition ${
                  tab === item
                    ? 'bg-brand-500 text-[#07110d]'
                    : 'bg-surface text-ink ring-1 ring-line hover:ring-brand-400'
                }`}
                onClick={() => setTab(item)}
              >
                {t(`finance.import.tabs.${item}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {tab === 'paste' ? (
            <Textarea
              id="finance-import-paste"
              label={t('finance.import.paste')}
              hint={t('finance.import.pasteHint')}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={'05.10.2026\t-450\tUAH\tATB'}
              className="min-h-36 font-mono text-[13px]"
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">{t('finance.import.photoHint')}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={analyzing}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" aria-hidden />
                  {t('finance.import.scan')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={analyzing}
                  onClick={() => galleryRef.current?.click()}
                >
                  <Images className="mr-2 h-4 w-4" aria-hidden />
                  {t('finance.import.gallery')}
                </Button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => void onFile(event)}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void onFile(event)}
              />
              {analyzing ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  {t('finance.import.analyzing')}
                </p>
              ) : null}
              <ErrorMessage message={scanError ?? undefined} />
            </div>
          )}

          {parsed.rows.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">
                {t('finance.import.count', { count: parsed.rows.length })}
              </p>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
                {parsed.rows.map((row, index) => {
                  const signed = row.type === 'EXPENSE' ? -row.amount : row.amount;
                  const category = row.categoryName
                    ? categories.find((item) => item.name.toLowerCase() === row.categoryName!.toLowerCase())
                    : null;
                  return (
                    <li key={`${row.date}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{row.comment || t('finance.noComment')}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {row.date}
                          {category ? ` · ${category.name}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold ${row.type === 'EXPENSE' ? 'text-expense' : 'text-brand-500'}`}
                        >
                          {formatSignedMoney(signed, language, row.currency)}
                        </p>
                        <Badge>{t(`finance.moneyKind.${row.moneyKind === 'CASH' ? 'cash' : 'electronic'}`)}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : text.trim() && tab === 'paste' ? (
            <p className="text-sm text-muted">{t('finance.import.empty')}</p>
          ) : null}
        </div>

        <ErrorMessage message={error ?? undefined} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={parsed.rows.length === 0 || analyzing}>
            {t('finance.import.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
