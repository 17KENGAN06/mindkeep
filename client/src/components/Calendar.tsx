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

const locales = { en: enUS, ru, uk, fi } as const;

type CalendarProps = {
  year: number;
  month: number;
  selectedDate: string | null;
  days: CalendarDaySummary[];
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: string) => void;
};

function dayTone(summary?: CalendarDaySummary): string {
  if (!summary || summary.total === 0) return 'bg-transparent';
  if (summary.overdue > 0) return 'bg-red-100 text-red-800 ring-red-200';
  if (summary.pending > 0) return 'bg-amber-100 text-amber-900 ring-amber-200';
  if (summary.completed > 0) return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  return 'bg-brand-50 text-brand-800 ring-brand-100';
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
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100 sm:p-5">
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

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`min-h-14 rounded-xl p-1 text-left transition ring-1 ring-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                inMonth ? 'text-ink' : 'text-muted/50'
              } ${dayTone(summary)} ${isSelected ? '!ring-2 !ring-brand-600' : ''}`}
            >
              <span className="block text-xs font-semibold sm:text-sm">{format(day, 'd')}</span>
              {summary && summary.total > 0 ? (
                <span className="mt-1 block text-[10px] font-medium sm:text-xs">
                  {summary.total}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> {t('calendar.legend.overdue')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {t('calendar.legend.pending')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />{' '}
          {t('calendar.legend.completed')}
        </span>
      </div>
    </div>
  );
}
