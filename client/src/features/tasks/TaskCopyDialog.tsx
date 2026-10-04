import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { AppLanguage } from '@/i18n';
import { formatMonthTitle, monthCells, weekdayLabels } from '@/utils/date';

type TaskCopyDialogProps = {
  open: boolean;
  from: string;
  taskCount: number;
  year: number;
  month: number;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onCopy: (dates: string[]) => void;
};

export function TaskCopyDialog({
  open,
  from,
  taskCount,
  year: initialYear,
  month: initialMonth,
  isLoading = false,
  error,
  onClose,
  onCopy,
}: TaskCopyDialogProps) {
  const { t, i18n } = useTranslation();
  const language = ((i18n.resolvedLanguage ?? i18n.language).split('-')[0] ?? 'en') as AppLanguage;
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setYear(initialYear);
    setMonth(initialMonth);
    setPicked([]);
  }, [open, initialYear, initialMonth]);
  const labels = weekdayLabels(language);
  const cells = monthCells(year, month);
  const pickedSet = new Set(picked);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const toggle = (date: string) => {
    if (date === from) return;
    setPicked((current) => {
      if (current.includes(date)) return current.filter((item) => item !== date);
      if (current.length >= 21) return current;
      return [...current, date].sort();
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-copy-title"
        className="w-full max-w-md space-y-4 rounded-2xl bg-panel p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (picked.length === 0) return;
          onCopy(picked);
        }}
      >
        <div>
          <h2 id="task-copy-title" className="text-lg font-semibold text-ink">
            {t('tasks.copyTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted">{t('tasks.copyHint')}</p>
          <p className="mt-2 text-sm font-medium text-ink">
            {t('tasks.copyFrom', { date: from, count: taskCount })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-ink"
            aria-label={t('tasks.copyPrevMonth')}
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-ink">{formatMonthTitle(year, month, language)}</p>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-ink"
            aria-label={t('tasks.copyNextMonth')}
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1">
            {labels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-center text-[10px] font-medium uppercase tracking-wide text-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              if (!cell.inMonth) {
                return <span key={`pad-${cell.date}`} className="aspect-square max-h-9 min-w-0" />;
              }
              const selected = pickedSet.has(cell.date);
              const source = cell.date === from;
              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={source}
                  aria-pressed={selected}
                  className={`inline-flex aspect-square max-h-9 min-w-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums transition touch-manipulation disabled:opacity-40 ${
                    selected
                      ? 'bg-brand-500 text-[#07110d]'
                      : source
                        ? 'bg-brand-50 text-ink ring-1 ring-brand-400'
                        : 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
                  }`}
                  onClick={() => toggle(cell.date)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-muted">{t('tasks.copyPicked', { count: picked.length })}</p>
        <ErrorMessage message={error ?? undefined} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={picked.length === 0}>
            {t('tasks.copySubmit', { count: picked.length })}
          </Button>
        </div>
      </form>
    </div>
  );
}
