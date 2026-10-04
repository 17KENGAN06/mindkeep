import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@/i18n';
import { monthCells, weekdayLabels } from '@/utils/date';

type StepsMonthGridProps = {
  year: number;
  month: number;
  today: string;
  startedOn: string;
  doneDates: ReadonlySet<string>;
  disabled?: boolean;
  onToggle: (date: string, done: boolean) => void;
};

export function canTrackSteps(date: string, startedOn: string, today: string) {
  return date >= startedOn && date <= today;
}

export function StepsMonthGrid({
  year,
  month,
  today,
  startedOn,
  doneDates,
  disabled = false,
  onToggle,
}: StepsMonthGridProps) {
  const { i18n } = useTranslation();
  const language = ((i18n.resolvedLanguage ?? i18n.language).split('-')[0] ?? 'en') as AppLanguage;
  const labels = weekdayLabels(language);
  const cells = monthCells(year, month);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`} className="text-center text-[10px] font-medium uppercase tracking-wide text-muted">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <span key={`pad-${cell.date}`} className="aspect-square max-h-8 min-w-0" />;
          }

          const done = doneDates.has(cell.date);
          const todayCell = cell.date === today;
          const trackable = canTrackSteps(cell.date, startedOn, today);
          const className = [
            'inline-flex aspect-square max-h-8 min-w-0 w-full items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition touch-manipulation',
            done
              ? 'bg-brand-500 text-[#07110d]'
              : todayCell && trackable
                ? 'bg-brand-50 text-ink ring-1 ring-brand-400'
                : trackable
                  ? 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
                  : cell.date < startedOn
                    ? 'bg-line/20 text-muted/70'
                    : 'bg-transparent text-muted/45 ring-1 ring-line/35',
          ]
            .filter(Boolean)
            .join(' ');

          if (!trackable || disabled) {
            return (
              <span key={cell.date} className={className}>
                {cell.day}
              </span>
            );
          }

          return (
            <button
              key={cell.date}
              type="button"
              aria-pressed={done}
              aria-current={todayCell ? 'date' : undefined}
              aria-label={String(cell.day)}
              className={className}
              onClick={() => onToggle(cell.date, !done)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
