import { useMemo } from 'react';
import { Check, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import { useDailyTasksPeriod } from '@/features/tasks/useDailyTasks';
import type { AppLanguage } from '@/i18n';
import type { DailyTask } from '@/types/dailyTask';
import { formatMonthTitle, monthCells, weekdayLabels } from '@/utils/date';

/** Task titles shown in one day cell before the rest folds into "+N". */
const VISIBLE_TASKS = 3;

const RING = 2 * Math.PI * 15;

type TaskMonthBoardProps = {
  year: number;
  month: number;
  today: string;
  onMonthChange: (year: number, month: number) => void;
  /** Opens the full day view (edit, delete, import, copy). */
  onOpenDay: (date: string) => void;
};

function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * Desktop month board: a Monday-first calendar of the month, each day with its tasks in
 * short form and a done/total count. A click on a day opens it in the Day view.
 */
export function TaskMonthBoard({ year, month, today, onMonthChange, onOpenDay }: TaskMonthBoardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const query = useDailyTasksPeriod({ view: 'month', year, month });

  // Drop the 6th row when the month fits in five weeks.
  const cells = useMemo(() => {
    const all = monthCells(year, month);
    return all.slice(35).some((cell) => cell.inMonth) ? all : all.slice(0, 35);
  }, [year, month]);
  const labels = useMemo(() => weekdayLabels(language), [language]);

  const byDate = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    for (const task of query.data?.tasks ?? []) {
      const list = map.get(task.date);
      if (list) list.push(task);
      else map.set(task.date, [task]);
    }
    for (const [date, list] of map) map.set(date, sortDailyTasks(list));
    return map;
  }, [query.data]);

  const totals = query.data?.totals;
  const monthTotal = totals?.total ?? 0;
  const monthDone = totals?.completed ?? 0;
  const monthPercent = monthTotal ? Math.round((monthDone / monthTotal) * 100) : 0;
  const activeDays = Array.from(byDate.values()).filter((list) => list.length > 0).length;

  const currentMonth = today.slice(0, 7) === `${year}-${String(month).padStart(2, '0')}`;
  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    onMonthChange(next.year, next.month);
  };

  return (
    <section className="space-y-4">
      <div className="dash-card flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
            aria-label={t('tasks.board.prevMonth')}
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <p className="min-w-[10.5rem] text-center text-base font-semibold text-ink capitalize tabular-nums">
            {formatMonthTitle(year, month, language)}
          </p>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
            aria-label={t('tasks.board.nextMonth')}
            onClick={() => go(1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          {currentMonth ? null : (
            <button
              type="button"
              className="ml-1 rounded-xl px-3 py-2 text-sm font-medium text-brand-500 transition hover:bg-brand-500/10"
              onClick={() => onMonthChange(Number(today.slice(0, 4)), Number(today.slice(5, 7)))}
            >
              {t('tasks.board.thisMonth')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold text-ink tabular-nums">{activeDays}</p>
            <p className="text-xs text-muted">{t('tasks.board.activeDays')}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink tabular-nums">
              {totals?.minutesDone ?? 0}/{totals?.minutes ?? 0} {t('tasks.minShort')}
            </p>
            <p className="text-xs text-muted">{t('tasks.statMinutes')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-brand-500/15" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="stroke-brand-500 transition-[stroke-dashoffset] duration-500 ease-out"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - monthPercent / 100)}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-ink tabular-nums">
                {monthPercent}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink tabular-nums">
                {monthDone} / {monthTotal}
              </p>
              <p className="text-xs text-muted">{t('tasks.board.monthDone')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`dash-card rounded-3xl bg-panel p-3 shadow-sm ring-1 ring-line ${query.isLoading ? 'opacity-60' : ''}`}>
        <div className="grid grid-cols-7 gap-1.5 pb-2">
          {labels.map((label) => (
            <p key={label} className="px-2 text-xs font-medium text-muted capitalize">
              {label}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            const isToday = cell.date === today;
            const list = cell.inMonth ? (byDate.get(cell.date) ?? []) : [];
            const done = list.filter((task) => task.completed).length;
            const complete = list.length > 0 && done === list.length;
            const percent = list.length ? Math.round((done / list.length) * 100) : 0;
            const hidden = list.length - VISIBLE_TASKS;
            return (
              <button
                key={cell.date}
                type="button"
                title={t('tasks.board.openDay')}
                className={`flex min-h-[7.5rem] min-w-0 flex-col rounded-2xl p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  cell.inMonth ? 'hover:bg-brand-500/[0.06]' : 'opacity-40 hover:opacity-70'
                } ${
                  isToday
                    ? 'bg-brand-500/[0.07] ring-1 ring-brand-500/60'
                    : 'ring-1 ring-line/60'
                }`}
                onClick={() => onOpenDay(cell.date)}
              >
                <span className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${
                      isToday ? 'bg-brand-500 text-on-brand' : cell.inMonth ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {list.length ? (
                    <span className={`text-[11px] tabular-nums ${complete ? 'font-semibold text-brand-500' : 'text-muted'}`}>
                      {done}/{list.length}
                    </span>
                  ) : null}
                </span>

                {list.length ? (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink/[0.07]">
                    <span
                      className="block h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                ) : null}

                <span className="mt-1.5 block space-y-0.5">
                  {list.slice(0, VISIBLE_TASKS).map((task) => (
                    <span key={task.id} className="flex min-w-0 items-center gap-1 text-[11px] leading-4">
                      {task.completed ? (
                        <Check className="h-3 w-3 shrink-0 text-brand-500" aria-hidden />
                      ) : task.important ? (
                        <Flag className="h-3 w-3 shrink-0 fill-current text-brand-500" aria-hidden />
                      ) : (
                        <span className="mx-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted/50" aria-hidden />
                      )}
                      <span className={`truncate ${task.completed ? 'text-muted line-through' : 'text-ink'}`}>
                        {task.title}
                      </span>
                    </span>
                  ))}
                  {hidden > 0 ? (
                    <span className="block pl-4 text-[11px] font-medium text-brand-500">
                      {t('tasks.board.more', { count: hidden })}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted">{t('tasks.board.monthHint')}</p>
    </section>
  );
}
