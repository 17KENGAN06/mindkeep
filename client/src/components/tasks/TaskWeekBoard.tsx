import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Flag, Plus, Timer, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import {
  useCreateDailyTask,
  useDailyTasksPeriod,
  useUpdateDailyTask,
} from '@/features/tasks/useDailyTasks';
import type { AppLanguage } from '@/i18n';
import type { DailyTask } from '@/types/dailyTask';
import { formatDayMonth, shiftDateKey, weekdayLong, weekdayShort } from '@/utils/date';

const weekdayShortKey = (key: string, language: AppLanguage) =>
  weekdayShort(Number(key.slice(0, 4)), Number(key.slice(5, 7)), Number(key.slice(8, 10)), language);

/** Monday of the week that holds `dateKey`. */
function weekStart(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!, 12)).getUTCDay();
  return shiftDateKey(dateKey, -((weekday + 6) % 7));
}

type Patch = { completed?: boolean; splitDone?: number };

type TaskWeekBoardProps = {
  /** Any day of the week to show. */
  anchorDate: string;
  today: string;
  onAnchorChange: (date: string) => void;
  /** Opens the full day view (edit, delete, import, copy). */
  onOpenDay: (date: string) => void;
  onEdit: (task: DailyTask) => void;
};

const RING = 2 * Math.PI * 15;

function DayRing({ percent }: { percent: number }) {
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90 @min-[72rem]:h-11 @min-[72rem]:w-11" aria-hidden>
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
 * Desktop week board: seven day columns, each with its own tasks and progress. Ticks can
 * be painted: press on a box and drag across others to set them all the same way. Ticks
 * show at once (optimistic) and are saved in the background.
 */
export function TaskWeekBoard({ anchorDate, today, onAnchorChange, onOpenDay, onEdit }: TaskWeekBoardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const monday = weekStart(anchorDate);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDateKey(monday, index)), [monday]);
  const sunday = days[6]!;

  // A week can span two months; the API serves whole months.
  const first = useDailyTasksPeriod({ view: 'month', year: Number(monday.slice(0, 4)), month: Number(monday.slice(5, 7)) });
  const crosses = monday.slice(0, 7) !== sunday.slice(0, 7);
  const second = useDailyTasksPeriod(
    { view: 'month', year: Number(sunday.slice(0, 4)), month: Number(sunday.slice(5, 7)) },
    crosses,
  );

  const updateTask = useUpdateDailyTask();
  const createTask = useCreateDailyTask();
  const [patches, setPatches] = useState<Record<string, Patch>>({});
  const [error, setError] = useState<string | null>(null);

  const serverTasks = useMemo(() => {
    const all = [...(first.data?.tasks ?? []), ...(crosses ? (second.data?.tasks ?? []) : [])];
    return all.filter((task) => task.date >= monday && task.date <= sunday);
  }, [crosses, first.data, monday, second.data, sunday]);

  // Server data that already matches a pending tick replaces it (adjusted during render).
  const [seenTasks, setSeenTasks] = useState(serverTasks);
  if (seenTasks !== serverTasks) {
    setSeenTasks(serverTasks);
    const next = { ...patches };
    let changed = false;
    for (const task of serverTasks) {
      const patch = next[task.id];
      if (!patch) continue;
      const matches =
        (patch.completed === undefined || patch.completed === task.completed) &&
        (patch.splitDone === undefined || patch.splitDone === task.splitDone);
      if (matches) {
        delete next[task.id];
        changed = true;
      }
    }
    if (changed) setPatches(next);
  }

  const tasks = serverTasks.map((task) => {
    const patch = patches[task.id];
    if (!patch) return task;
    const count = Math.max(1, task.splitCount ?? 1);
    const merged = { ...task, ...patch };
    if (patch.splitDone !== undefined && count > 1) merged.completed = patch.splitDone >= count;
    if (patch.completed !== undefined && count > 1) merged.splitDone = patch.completed ? count : 0;
    return merged;
  });

  const save = (task: DailyTask, patch: Patch) => {
    setPatches((current) => ({ ...current, [task.id]: { ...current[task.id], ...patch } }));
    updateTask.mutateAsync({ id: task.id, payload: patch }).catch(() => {
      setPatches((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
      setError(t('auth.errors.generic'));
    });
  };

  // Painting: the first box decides tick or untick; boxes the pointer passes over follow.
  // A plain mutable holder (not state): changing it must not re-render.
  const [paint] = useState<{ current: boolean | null }>(() => ({ current: null }));
  useEffect(() => {
    const stop = () => {
      paint.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [paint]);

  const setTask = (task: DailyTask, completed: boolean) => {
    if (task.completed !== completed) save(task, { completed });
  };
  const setPart = (task: DailyTask, index: number, on: boolean) => {
    const done = Math.max(0, task.splitDone ?? 0);
    const target = on ? Math.max(done, index + 1) : Math.min(done, index);
    if (target !== done) save(task, { splitDone: target });
  };

  // Works for mouse and touch alike: the box under the pointer is looked up by position,
  // because a touch keeps sending its events to the box it started on.
  const onPaintMove = (event: PointerEvent<HTMLDivElement>) => {
    if (paint.current === null) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-paint-task]');
    const task = target ? tasks.find((item) => item.id === target.dataset.paintTask) : undefined;
    if (!target || !task) return;
    const part = target.dataset.paintPart;
    if (part === undefined) setTask(task, paint.current);
    else setPart(task, Number(part), paint.current);
  };

  const byDay = days.map((date) => {
    const list = sortDailyTasks(tasks.filter((task) => task.date === date));
    const done = list.filter((task) => task.completed).length;
    return { date, list, done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 };
  });
  const weekDone = byDay.reduce((sum, day) => sum + day.done, 0);
  const weekTotal = byDay.reduce((sum, day) => sum + day.total, 0);
  const weekPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;
  const busiest = Math.max(1, ...byDay.map((day) => day.total));

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const onAdd = async (event: FormEvent, date: string) => {
    event.preventDefault();
    const title = (drafts[date] ?? '').trim();
    if (!title) return;
    setError(null);
    try {
      await createTask.mutateAsync({ title, minutes: 30, date });
      setDrafts((current) => ({ ...current, [date]: '' }));
    } catch (err) {
      setError(mutationErrorMessage(err, t));
    }
  };

  const paintProps = (checked: boolean, label: string, onDown: () => void, taskId: string, part?: number) => ({
    type: 'button' as const,
    role: 'checkbox',
    'aria-checked': checked,
    'aria-label': label,
    'data-paint-task': taskId,
    'data-paint-part': part,
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      // Let the pointer keep painting across other boxes.
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      onDown();
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onDown();
        paint.current = null;
      }
    },
  });

  const box = (checked: boolean, label: string, onDown: () => void, taskId: string) => (
    <button
      {...paintProps(checked, label, onDown, taskId)}
      className={`inline-flex h-5 w-5 shrink-0 touch-none items-center justify-center rounded-md border transition duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
        checked
          ? 'scale-100 border-brand-500 bg-brand-500 text-on-brand'
          : 'border-muted/45 bg-panel hover:border-brand-400 active:scale-90'
      }`}
    >
      <svg viewBox="0 0 12 12" className={`h-3 w-3 transition ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} aria-hidden>
        <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  const loading = first.isLoading || (crosses && second.isLoading);

  return (
    <section className="space-y-4">
      <div className="dash-card flex flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
            aria-label={t('tasks.board.prevWeek')}
            onClick={() => onAnchorChange(shiftDateKey(monday, -7))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <p className="min-w-[10.5rem] text-center text-base font-semibold text-ink tabular-nums">
            {formatDayMonth(monday, language)} – {formatDayMonth(sunday, language)}
          </p>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
            aria-label={t('tasks.board.nextWeek')}
            onClick={() => onAnchorChange(shiftDateKey(monday, 7))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          {today < monday || today > sunday ? (
            <button
              type="button"
              className="ml-1 rounded-xl px-3 py-2 text-sm font-medium text-brand-500 transition hover:bg-brand-500/10"
              onClick={() => onAnchorChange(today)}
            >
              {t('tasks.board.thisWeek')}
            </button>
          ) : null}
        </div>

        {/* Week overview: one bar per day, filled by what is done. */}
        <div className="flex h-14 min-w-[16rem] flex-1 items-end gap-2" aria-hidden>
          {byDay.map((day) => (
            <div key={day.date} className="flex h-full flex-1 flex-col justify-end">
              <div
                className="relative overflow-hidden rounded-md bg-brand-500/[0.12]"
                style={{ height: `${Math.max((day.total / busiest) * 100, 8)}%` }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md bg-brand-500 transition-[height] duration-500 ease-out"
                  style={{ height: `${day.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <DayRing percent={weekPercent} />
            <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-ink tabular-nums">
              {weekPercent}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink tabular-nums">
              {weekDone} / {weekTotal}
            </p>
            <p className="text-xs text-muted">{t('tasks.board.weekDone')}</p>
          </div>
        </div>
      </div>

      <ErrorMessage message={error ?? undefined} />

      {/* Columns follow the board's own width: 4 per row on tablets, all 7 from ~1024px. */}
      <div className="@container" onPointerMove={onPaintMove}>
      <div className={`grid grid-cols-4 gap-2.5 @min-[64rem]:grid-cols-7 @min-[72rem]:gap-3 ${loading ? 'opacity-60' : ''}`}>
        {byDay.map((day) => {
          const isToday = day.date === today;
          const complete = day.total > 0 && day.done === day.total;
          return (
            <div
              key={day.date}
              className={`dash-card flex min-w-0 flex-col rounded-2xl bg-panel shadow-sm ring-1 transition ${
                isToday ? 'ring-brand-500/60' : 'ring-line'
              }`}
            >
              <button
                type="button"
                className={`flex items-center justify-between gap-1.5 rounded-t-2xl border-b px-2.5 py-2.5 text-left @min-[72rem]:gap-2 @min-[72rem]:px-3 @min-[72rem]:py-3 transition hover:bg-brand-500/[0.05] ${
                  isToday ? 'border-brand-500/30 bg-brand-500/[0.07]' : 'border-line'
                }`}
                title={t('tasks.board.openDay')}
                onClick={() => onOpenDay(day.date)}
              >
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-semibold capitalize ${isToday ? 'text-brand-500' : 'text-ink'}`}>
                    <span className="hidden @min-[72rem]:inline">{weekdayLong(day.date, language)}</span>
                    <span className="@min-[72rem]:hidden">{weekdayShortKey(day.date, language)}</span>
                  </span>
                  <span className="block text-xs text-muted tabular-nums">{formatDayMonth(day.date, language)}</span>
                </span>
                <span className="relative shrink-0">
                  <DayRing percent={day.percent} />
                  <span className="absolute inset-0 grid place-items-center text-[9px] @min-[72rem]:text-[10px] font-semibold text-ink tabular-nums">
                    {complete ? <Trophy className="h-4 w-4 text-brand-500" aria-hidden /> : `${day.percent}%`}
                  </span>
                </span>
              </button>

              <ul className="flex-1 space-y-0.5 px-2 py-2">
                {day.list.map((task) => {
                  const count = Math.max(1, task.splitCount ?? 1);
                  const partsDone = Math.min(count, Math.max(0, task.splitDone ?? 0));
                  return (
                    <li key={task.id} className="rounded-lg px-1.5 py-1.5 transition hover:bg-brand-500/[0.05]">
                      <div className="flex items-start gap-2">
                        <span className="pt-px">
                          {box(
                            task.completed,
                            task.title,
                            () => {
                              paint.current = !task.completed;
                              setTask(task, paint.current);
                            },
                            task.id,
                          )}
                        </span>
                        <button
                          type="button"
                          className={`min-w-0 flex-1 text-left text-[13px] leading-snug break-words transition [overflow-wrap:anywhere] ${
                            task.completed ? 'text-muted line-through decoration-brand-500/60' : 'text-ink'
                          }`}
                          title={t('tasks.edit')}
                          onClick={() => onEdit(task)}
                        >
                          {task.title}
                        </button>
                        {task.important ? <Flag className="mt-0.5 h-3 w-3 shrink-0 fill-current text-brand-500" aria-hidden /> : null}
                      </div>
                      {count > 1 ? (
                        <div className="mt-2 ml-7">
                          {/* One joined bar: done parts filled, the next one outlined. */}
                          <div className="flex h-3.5 gap-[3px]">
                            {Array.from({ length: count }, (_, index) => {
                              const done = index < partsDone;
                              const next = index === partsDone;
                              return (
                                <button
                                  key={index}
                                  {...paintProps(
                                    done,
                                    `${task.title} ${index + 1}/${count}`,
                                    () => {
                                      paint.current = !done;
                                      setPart(task, index, paint.current);
                                    },
                                    task.id,
                                    index,
                                  )}
                                  className={`relative min-w-0 flex-1 touch-none transition-colors duration-200 select-none first:rounded-l-full last:rounded-r-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                                    done
                                      ? 'bg-brand-500'
                                      : next && !task.completed
                                        ? 'bg-brand-500/20 ring-1 ring-brand-500/60 ring-inset hover:bg-brand-500/35'
                                        : 'bg-brand-500/[0.12] hover:bg-brand-500/25'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted tabular-nums">
                            <span className={partsDone === count ? 'font-semibold text-brand-500' : 'font-semibold text-ink'}>
                              {partsDone}/{count}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3 w-3" aria-hidden />
                              {Math.max(1, Math.round(task.minutes / count))} {t('tasks.minShort')}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <form className="px-2 pb-2" onSubmit={(event) => void onAdd(event, day.date)}>
                <label className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-muted ring-line transition focus-within:ring-1 hover:bg-brand-500/[0.05]">
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  <input
                    value={drafts[day.date] ?? ''}
                    onChange={(event) => setDrafts((current) => ({ ...current, [day.date]: event.target.value }))}
                    placeholder={t('tasks.board.add')}
                    aria-label={`${t('tasks.board.add')} · ${formatDayMonth(day.date, language)}`}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
                  />
                </label>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-x-2 border-t border-line px-3 py-2 text-xs text-muted tabular-nums">
                <span>
                  {t('tasks.board.done')} <span className="font-semibold text-ink">{day.done}</span>
                </span>
                <span>
                  {t('tasks.board.left')} <span className="font-semibold text-ink">{day.total - day.done}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
      <p className="text-xs text-muted">{t('tasks.board.hint')}</p>
    </section>
  );
}
