import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flag, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import { TaskMonthStats } from '@/components/tasks/TaskMonthStats';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import { useDailyTasksPeriod, useUpdateDailyTask } from '@/features/tasks/useDailyTasks';
import type { AppLanguage } from '@/i18n';
import type { DailyTask } from '@/types/dailyTask';
import { formatMonthShort, formatMonthTitle, monthCells, weekdayLabels } from '@/utils/date';

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

function Ring({ percent, className }: { percent: number; className: string }) {
  return (
    <svg viewBox="0 0 36 36" className={`-rotate-90 ${className}`} aria-hidden>
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
        strokeDashoffset={RING * (1 - percent / 100)}
      />
    </svg>
  );
}

/**
 * Desktop month board: a Monday-first calendar of the month. Each day is a card in the week
 * board's style — its tasks with tick boxes, progress ring and Done / Left. Ticks show at once
 * and are saved in the background; a click elsewhere on a day opens it in the Day view.
 */
export function TaskMonthBoard({ year, month, today, onMonthChange, onOpenDay }: TaskMonthBoardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const query = useDailyTasksPeriod({ view: 'month', year, month });
  const updateTask = useUpdateDailyTask();
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Server data that already matches a pending tick replaces it (adjusted during render).
  const serverTasks = query.data?.tasks;
  const [seenTasks, setSeenTasks] = useState(serverTasks);
  if (seenTasks !== serverTasks) {
    setSeenTasks(serverTasks);
    const next = { ...ticks };
    let changed = false;
    for (const task of serverTasks ?? []) {
      if (task.id in next && next[task.id] === task.completed) {
        delete next[task.id];
        changed = true;
      }
    }
    if (changed) setTicks(next);
  }

  const toggle = (task: DailyTask, completed: boolean) => {
    setError(null);
    setTicks((current) => ({ ...current, [task.id]: !completed }));
    updateTask.mutateAsync({ id: task.id, payload: { completed: !completed } }).catch((err: unknown) => {
      setTicks((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
      setError(mutationErrorMessage(err, t));
    });
  };

  // Drop the 6th row when the month fits in five weeks.
  const cells = useMemo(() => {
    const all = monthCells(year, month);
    return all.slice(35).some((cell) => cell.inMonth) ? all : all.slice(0, 35);
  }, [year, month]);
  const lead = cells.findIndex((cell) => cell.inMonth);
  const monthName = new Intl.DateTimeFormat(language, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  const labels = useMemo(() => weekdayLabels(language), [language]);
  const monthShort = formatMonthShort(year, month, language);

  const byDate = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    for (const task of serverTasks ?? []) {
      const merged = task.id in ticks ? { ...task, completed: ticks[task.id]! } : task;
      const list = map.get(task.date);
      if (list) list.push(merged);
      else map.set(task.date, [merged]);
    }
    for (const [date, list] of map) map.set(date, sortDailyTasks(list));
    return map;
  }, [serverTasks, ticks]);

  const all = Array.from(byDate.values()).flat();
  const monthTotal = all.length;
  const monthDone = all.filter((task) => task.completed).length;
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <Ring percent={monthPercent} className="h-11 w-11" />
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

      <TaskMonthStats year={year} month={month} today={today} byDate={byDate} />

      <ErrorMessage message={error ?? undefined} />

      <div className={query.isLoading ? 'opacity-60' : ''}>
        <div className="grid grid-cols-7 gap-3 pb-2">
          {labels.map((label) => (
            <p key={label} className="px-3 text-sm font-semibold text-muted capitalize">
              {label}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-3">
          {/* The slots before day 1 become one month cover instead of empty days. */}
          {lead > 0 ? (
            <div
              className={`relative overflow-hidden rounded-2xl ${
                lead > 1
                  ? 'bg-gradient-to-br from-brand-500/[0.14] via-brand-500/[0.05] to-transparent p-5 ring-1 ring-brand-500/15'
                  : ''
              }`}
              style={{ gridColumn: `span ${lead}` }}
              aria-hidden
            >
              {lead > 1 ? (
                <>
                  <div className="absolute -right-10 -bottom-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
                  <p className="relative text-4xl font-bold text-ink capitalize">{monthName}</p>
                  <p className="relative mt-1 text-lg font-semibold text-brand-500 tabular-nums">{year}</p>
                  {lead > 2 ? (
                    <p className="relative mt-6 max-w-sm text-sm leading-6 text-muted">{t('tasks.board.monthHint')}</p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
          {cells.slice(lead).map((cell) => {
            const isToday = cell.date === today;
            // Days after the month's end are left out; the grid simply ends.
            if (!cell.inMonth) return null;
            const list = byDate.get(cell.date) ?? [];
            const done = list.filter((task) => task.completed).length;
            const complete = list.length > 0 && done === list.length;
            const percent = list.length ? Math.round((done / list.length) * 100) : 0;
            return (
              <div
                key={cell.date}
                className={`dash-card flex min-h-[14rem] min-w-0 cursor-pointer flex-col rounded-2xl bg-panel shadow-sm transition hover:ring-brand-500/50 ${
                  isToday ? 'ring-1 ring-brand-500/60' : 'ring-1 ring-line'
                }`}
                onClick={() => onOpenDay(cell.date)}
              >
                <button
                  type="button"
                  className={`flex items-center justify-between gap-2 rounded-t-2xl border-b px-3 py-2.5 text-left transition hover:bg-brand-500/[0.05] ${
                    isToday ? 'border-brand-500/30 bg-brand-500/[0.07]' : 'border-line'
                  }`}
                  title={t('tasks.board.openDay')}
                >
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold tabular-nums ${isToday ? 'text-brand-500' : 'text-ink'}`}>
                      {cell.day}
                    </span>
                    <span className="block text-xs text-muted capitalize">{monthShort}</span>
                  </span>
                  {list.length ? (
                    <span className="relative shrink-0">
                      <Ring percent={percent} className="h-9 w-9" />
                      <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-ink tabular-nums">
                        {complete ? <Trophy className="h-4 w-4 text-brand-500" aria-hidden /> : `${percent}%`}
                      </span>
                    </span>
                  ) : null}
                </button>

                <ul className="flex-1 space-y-0.5 px-2 py-2">
                  {list.map((task) => (
                    <li key={task.id} className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-brand-500/[0.05]">
                      <span className="flex h-5 shrink-0 items-center">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={task.completed}
                          aria-label={task.title}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggle(task, task.completed);
                          }}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                            task.completed
                              ? 'border-brand-500 bg-brand-500 text-on-brand'
                              : 'border-muted/45 bg-panel hover:border-brand-400 active:scale-90'
                          }`}
                        >
                          <svg
                            viewBox="0 0 12 12"
                            className={`h-3 w-3 transition ${task.completed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                            aria-hidden
                          >
                            <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[13px] leading-5 break-words [overflow-wrap:anywhere] ${
                          task.completed ? 'text-muted line-through decoration-brand-500/60' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.important ? (
                        <Flag className="mt-1 h-3 w-3 shrink-0 fill-current text-brand-500" aria-hidden />
                      ) : null}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-x-2 border-t border-line px-3 py-2 text-xs text-muted tabular-nums">
                  <span>
                    {t('tasks.board.done')} <span className="font-semibold text-ink">{done}</span>
                  </span>
                  <span>
                    {t('tasks.board.left')} <span className="font-semibold text-ink">{list.length - done}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {lead > 2 ? null : <p className="text-xs text-muted">{t('tasks.board.monthHint')}</p>}
    </section>
  );
}
