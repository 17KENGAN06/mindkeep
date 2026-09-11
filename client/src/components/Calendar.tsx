import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { enUS, fi, ru, uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { AppLanguage } from '@/i18n';
import type { CalendarDaySummary } from '@/types/calendar';
import { toDateInputValue } from '@/utils/date';

const locales = { en: enUS, ru, uk, fi } as const;

type CalendarProps = {
  year: number;
  month: number;
  selectedDate: string | null;
  days: CalendarDaySummary[];
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: string) => void;
};

type DayStatus = 'overdue' | 'pending' | 'completed' | 'skipped' | 'none';

const wash: Record<DayStatus, string> = {
  overdue: 'bg-red-500/[0.09] hover:bg-red-500/[0.14]',
  pending: 'bg-amber-500/[0.09] hover:bg-amber-500/[0.14]',
  completed: 'bg-emerald-500/[0.09] hover:bg-emerald-500/[0.14]',
  skipped: 'bg-brand-50/60 hover:bg-brand-50',
  none: 'bg-transparent hover:bg-brand-50/50',
};

const pill: Record<Exclude<DayStatus, 'none'>, string> = {
  overdue: 'bg-red-500/18 text-red-500 ring-red-500/35',
  pending: 'bg-amber-500/18 text-amber-500 ring-amber-500/35',
  completed: 'bg-emerald-500/18 text-emerald-400 ring-emerald-500/35',
  skipped: 'bg-line/70 text-muted ring-line',
};

function dayStatus(summary?: CalendarDaySummary): DayStatus {
  if (!summary || summary.total === 0) return 'none';
  if (summary.overdue > 0) return 'overdue';
  if (summary.pending > 0) return 'pending';
  if (summary.completed > 0) return 'completed';
  if (summary.skipped > 0) return 'skipped';
  return 'none';
}

function StatusMix({ summary }: { summary: CalendarDaySummary }) {
  const parts = [
    { key: 'overdue', n: summary.overdue, className: 'bg-red-400' },
    { key: 'pending', n: summary.pending, className: 'bg-amber-400' },
    { key: 'completed', n: summary.completed, className: 'bg-emerald-400' },
  ].filter((part) => part.n > 0);

  if (parts.length < 2) return null;

  return (
    <span className="flex h-1 w-7 overflow-hidden rounded-full bg-line/50" aria-hidden>
      {parts.map((part) => (
        <span
          key={part.key}
          className={`h-full min-w-[3px] ${part.className}`}
          style={{ flexGrow: part.n, flexBasis: 0 }}
        />
      ))}
    </span>
  );
}

function CountMark({ summary, dimmed }: { summary: CalendarDaySummary; dimmed: boolean }) {
  const status = dayStatus(summary);
  if (status === 'none') return null;

  return (
    <span className={`mt-auto flex flex-col items-center gap-1 ${dimmed ? 'opacity-50' : ''}`}>
      <StatusMix summary={summary} />
      <span
        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ring-1 sm:h-[1.35rem] sm:min-w-[1.35rem] sm:text-[11px] ${pill[status]}`}
      >
        {summary.total}
      </span>
    </span>
  );
}

export function Calendar({
  year,
  month,
  selectedDate,
  days,
  onMonthChange,
  onSelectDate,
}: CalendarProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const locale = locales[language] ?? enUS;
  const todayKey = toDateInputValue();

  const monthDate = new Date(year, month - 1, 1);
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekdayLabels = eachDayOfInterval({
    start: gridStart,
    end: endOfWeek(gridStart, { weekStartsOn: 1 }),
  }).map((day) => format(day, 'EE', { locale }));

  const summaryByDate = new Map(days.map((day) => [day.date, day]));
  const selected = selectedDate ? parseISO(selectedDate) : null;

  return (
    <div className="rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          aria-label={t('calendar.prevMonth')}
          onClick={() => {
            const prev = subMonths(monthDate, 1);
            onMonthChange(prev.getFullYear(), prev.getMonth() + 1);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold capitalize text-ink">
          {format(monthDate, 'LLLL yyyy', { locale })}
        </h2>
        <Button
          type="button"
          variant="ghost"
          aria-label={t('calendar.nextMonth')}
          onClick={() => {
            const next = addMonths(monthDate, 1);
            onMonthChange(next.getFullYear(), next.getMonth() + 1);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted sm:text-xs">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const summary = summaryByDate.get(key);
          const inMonth = isSameMonth(day, monthDate);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isToday = key === todayKey;
          const status = dayStatus(summary);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              aria-label={
                summary && summary.total > 0
                  ? t('calendar.cellAria', {
                      day: format(day, 'd MMMM', { locale }),
                      count: summary.total,
                    })
                  : format(day, 'd MMMM', { locale })
              }
              className={`flex min-h-[4.25rem] flex-col items-center rounded-2xl px-1 py-1.5 transition ring-1 ring-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:min-h-[4.75rem] ${
                wash[status]
              } ${inMonth ? '' : 'opacity-55'} ${
                isSelected ? '!ring-2 !ring-brand-500' : isToday ? 'ring-brand-500/35' : ''
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center text-xs font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-sm ${
                  isToday
                    ? 'rounded-full bg-brand-500 font-bold text-surface'
                    : inMonth
                      ? 'text-ink'
                      : 'text-muted'
                }`}
              >
                {format(day, 'd')}
              </span>
              {summary && summary.total > 0 ? (
                <CountMark summary={summary} dimmed={!inMonth} />
              ) : (
                <span className="mt-auto h-5" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-5 min-w-5 rounded-full bg-red-500/18 ring-1 ring-red-500/35" />
          {t('calendar.legend.overdue')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-5 min-w-5 rounded-full bg-amber-500/18 ring-1 ring-amber-500/35" />
          {t('calendar.legend.pending')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-5 min-w-5 rounded-full bg-emerald-500/18 ring-1 ring-emerald-500/35" />
          {t('calendar.legend.completed')}
        </span>
      </div>
    </div>
  );
}
