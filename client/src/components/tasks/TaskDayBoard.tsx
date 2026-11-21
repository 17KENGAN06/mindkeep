import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  ListPlus,
  Pencil,
  Plus,
  Split,
  Timer,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import { useDailyTasksPeriod, useUpdateDailyTask } from '@/features/tasks/useDailyTasks';
import type { AppLanguage } from '@/i18n';
import type { DailyTask } from '@/types/dailyTask';
import {
  formatDayMonth,
  formatMonthTitle,
  monthCells,
  shiftDateKey,
  weekdayLabels,
  weekdayLong,
  weekdayShort,
} from '@/utils/date';

const SPLIT_CHOICES = [2, 3, 4, 5, 6, 7, 8] as const;
/** Above this the day is shown as overloaded. */
const DAY_CAPACITY_MINUTES = 8 * 60;
const RING = 2 * Math.PI * 15;

type Translate = (key: string, opts?: Record<string, unknown>) => string;

function formatMinutes(minutes: number, t: Translate) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return t('tasks.durationHoursMinutes', { hours, minutes: rest });
  if (hours > 0) return t('tasks.durationHours', { hours });
  return t('tasks.durationMinutes', { minutes });
}

function weekStart(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!, 12)).getUTCDay();
  return shiftDateKey(dateKey, -((weekday + 6) % 7));
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
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

function tally(tasks: DailyTask[]) {
  const done = tasks.filter((task) => task.completed).length;
  return { total: tasks.length, done, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

type TaskDayBoardProps = {
  date: string;
  today: string;
  /** Every task of the month that holds `date`. */
  monthTasks: DailyTask[];
  busyId: string | null;
  highlightId: string | null;
  formError: string | null;
  isCreating: boolean;
  onDateChange: (date: string) => void;
  onCreate: (title: string, minutes: number) => Promise<boolean>;
  onToggle: (task: DailyTask) => void;
  onImportant: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  onEdit: (task: DailyTask) => void;
  onSplit: (task: DailyTask, count: number) => void;
  onSetPart: (task: DailyTask, done: number) => void;
  onImport: () => void;
  onCopy: () => void;
  onYearView: () => void;
};

/**
 * Desktop day view: the day's header with progress and time, a week strip, the task list
 * with quiet hover actions and an inline add row; on the side a month calendar and stats.
 */
export function TaskDayBoard({
  date,
  today,
  monthTasks,
  busyId,
  highlightId,
  formError,
  isCreating,
  onDateChange,
  onCreate,
  onToggle,
  onImportant,
  onDelete,
  onEdit,
  onSplit,
  onSetPart,
  onImport,
  onCopy,
  onYearView,
}: TaskDayBoardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));

  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const updateTask = useUpdateDailyTask();

  // The week strip can reach into the next or previous month.
  const monday = weekStart(date);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDateKey(monday, index)), [monday]);
  const otherMonth = [week[0]!, week[6]!].find((key) => key.slice(0, 7) !== date.slice(0, 7));
  const neighbour = useDailyTasksPeriod(
    {
      view: 'month',
      year: Number((otherMonth ?? date).slice(0, 4)),
      month: Number((otherMonth ?? date).slice(5, 7)),
    },
    Boolean(otherMonth),
  );

  const byDate = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    const all = [...monthTasks, ...(otherMonth ? (neighbour.data?.tasks ?? []) : [])];
    for (const task of all) {
      const list = map.get(task.date);
      if (list) list.push(task);
      else map.set(task.date, [task]);
    }
    return map;
  }, [monthTasks, neighbour.data, otherMonth]);

  const tasks = useMemo(() => sortDailyTasks(byDate.get(date) ?? []), [byDate, date]);
  const day = tally(tasks);
  const minutesTotal = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const minutesDone = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.minutes, 0);
  const overloaded = minutesTotal > DAY_CAPACITY_MINUTES;
  const unfinished = tasks.filter((task) => !task.completed);
  // Past days hand their leftovers to today; today and later days to the next day.
  const moveTarget = date < today ? today : shiftDateKey(date, 1);

  const month_ = useMemo(() => {
    const prefix = monthKey(year, month);
    const inMonth = monthTasks.filter((task) => task.date.startsWith(prefix));
    const days = new Map<string, DailyTask[]>();
    for (const task of inMonth) days.set(task.date, [...(days.get(task.date) ?? []), task]);
    const perfect = [...days.values()].filter((list) => list.every((task) => task.completed)).length;
    return { ...tally(inMonth), activeDays: days.size, perfect };
  }, [monthTasks, year, month]);

  const cells = useMemo(() => {
    const all = monthCells(year, month);
    return all.slice(35).some((cell) => cell.inMonth) ? all : all.slice(0, 35);
  }, [year, month]);
  const labels = useMemo(() => weekdayLabels(language), [language]);

  const goMonth = (delta: number) => {
    const index = year * 12 + (month - 1) + delta;
    const nextYear = Math.floor(index / 12);
    const nextMonth = (index % 12) + 1;
    onDateChange(monthKey(nextYear, nextMonth) === today.slice(0, 7) ? today : `${monthKey(nextYear, nextMonth)}-01`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await onCreate(title, Number(minutes));
    if (ok) {
      setTitle('');
      setMinutes('30');
    }
  };

  const moveUnfinished = async () => {
    setMoving(true);
    setMoveError(null);
    try {
      for (const task of unfinished) {
        await updateTask.mutateAsync({ id: task.id, payload: { date: moveTarget } });
      }
    } catch (error) {
      setMoveError(mutationErrorMessage(error, t));
    } finally {
      setMoving(false);
    }
  };

  const iconButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-brand-500/10 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40';
  const toolButton =
    'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted ring-1 ring-line transition hover:bg-brand-500/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40';

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
        {/* Day header: navigation, progress and time, then the week strip. */}
        <section className="dash-card rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
                aria-label={t('tasks.day.prev')}
                onClick={() => onDateChange(shiftDateKey(date, -1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="min-w-[12rem] px-1 text-center">
                <p className="text-lg font-semibold text-ink capitalize">{weekdayLong(date, language)}</p>
                <p className="text-xs text-muted tabular-nums">
                  {formatDayMonth(date, language)} {year}
                  {date === today ? <span className="ml-1.5 font-semibold text-brand-500">· {t('tasks.day.today')}</span> : null}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted ring-1 ring-line transition hover:text-ink"
                aria-label={t('tasks.day.next')}
                onClick={() => onDateChange(shiftDateKey(date, 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              {date === today ? null : (
                <button
                  type="button"
                  className="ml-1 rounded-xl px-3 py-2 text-sm font-medium text-brand-500 transition hover:bg-brand-500/10"
                  onClick={() => onDateChange(today)}
                >
                  {t('tasks.day.today')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="min-w-[11rem]">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-muted">{t('tasks.day.time')}</span>
                  <span className={`font-semibold tabular-nums ${overloaded ? 'text-amber-400' : 'text-ink'}`}>
                    {formatMinutes(minutesDone, t)} / {formatMinutes(minutesTotal, t)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${minutesTotal ? Math.round((minutesDone / minutesTotal) * 100) : 0}%` }}
                  />
                </div>
                <p className={`mt-1.5 text-[11px] ${overloaded ? 'text-amber-400' : 'text-muted'}`}>
                  {overloaded ? t('tasks.day.overloaded') : t('tasks.day.load', { percent: Math.round((minutesTotal / DAY_CAPACITY_MINUTES) * 100) })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Ring percent={day.percent} className="h-12 w-12" />
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-ink tabular-nums">
                    {day.total > 0 && day.done === day.total ? <Trophy className="h-5 w-5 text-brand-500" aria-hidden /> : `${day.percent}%`}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-ink tabular-nums">
                    {day.done} / {day.total}
                  </p>
                  <p className="text-xs text-muted">{t('tasks.day.done')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {week.map((key) => {
              const stats = tally(byDate.get(key) ?? []);
              const selected = key === date;
              const isToday = key === today;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onDateChange(key)}
                  className={`rounded-2xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    selected ? 'bg-brand-500/[0.1] ring-1 ring-brand-500/60' : 'ring-1 ring-line/60 hover:bg-brand-500/[0.05]'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-1">
                    <span className={`text-xs capitalize ${isToday ? 'font-semibold text-brand-500' : 'text-muted'}`}>
                      {weekdayShort(Number(key.slice(0, 4)), Number(key.slice(5, 7)), Number(key.slice(8, 10)), language)}
                    </span>
                    <span className="text-[11px] text-muted tabular-nums">{stats.total ? `${stats.done}/${stats.total}` : '–'}</span>
                  </span>
                  <span className={`mt-0.5 block text-base font-semibold tabular-nums ${selected ? 'text-brand-500' : 'text-ink'}`}>
                    {Number(key.slice(8, 10))}
                  </span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink/[0.07]">
                    <span className="block h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${stats.percent}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Task list. */}
        <section className="dash-card overflow-hidden rounded-3xl bg-panel shadow-sm ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">
              {t('tasks.day.tasks')} <span className="ml-1 text-sm font-medium text-muted tabular-nums">{day.total}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {unfinished.length > 0 ? (
                <button type="button" className={toolButton} disabled={moving} onClick={() => void moveUnfinished()}>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                  {t('tasks.day.move', { count: unfinished.length, date: formatDayMonth(moveTarget, language) })}
                </button>
              ) : null}
              <button type="button" className={toolButton} onClick={onImport}>
                <ListPlus className="h-4 w-4" aria-hidden />
                {t('tasks.import')}
              </button>
              <button type="button" className={toolButton} disabled={tasks.length === 0} title={tasks.length ? undefined : t('tasks.copyNone')} onClick={onCopy}>
                <Copy className="h-4 w-4" aria-hidden />
                {t('tasks.copy')}
              </button>
            </div>
          </div>
          <ErrorMessage message={moveError ?? undefined} />

          {tasks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-ink">{t('tasks.emptyDay')}</p>
              <p className="mt-1 text-sm text-muted">{t('tasks.day.emptyHint')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/60">
              {tasks.map((task) => {
                const count = Math.max(1, task.splitCount ?? 1);
                const partsDone = Math.min(count, Math.max(0, task.splitDone ?? 0));
                const busy = busyId === task.id;
                const picking = pickingId === task.id;
                const highlighted = highlightId === task.id;
                return (
                  <li
                    key={task.id}
                    id={`task-${task.id}`}
                    className={`group/task scroll-mt-24 px-5 py-3.5 transition duration-500 ${
                      highlighted ? 'bg-brand-500/[0.08] ring-2 ring-brand-400 ring-inset' : 'hover:bg-brand-500/[0.03]'
                    } ${busy ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.completed}
                        aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
                        disabled={busy}
                        onClick={() => onToggle(task)}
                        className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                          task.completed
                            ? 'border-brand-500 bg-brand-500 text-on-brand'
                            : 'border-muted/45 bg-panel hover:border-brand-400 active:scale-90'
                        }`}
                      >
                        <svg viewBox="0 0 12 12" className={`h-3.5 w-3.5 transition ${task.completed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} aria-hidden>
                          <path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[15px] leading-6 font-medium break-words [overflow-wrap:anywhere] ${
                            task.completed ? 'text-muted line-through decoration-brand-500/60' : 'text-ink'
                          }`}
                        >
                          {task.important ? <Flag className="mr-1.5 mb-0.5 inline h-3.5 w-3.5 fill-current text-brand-500" aria-hidden /> : null}
                          {task.title}
                        </p>
                        {task.note ? <p className="mt-0.5 text-xs leading-relaxed break-words text-muted">{task.note}</p> : null}

                        {count > 1 ? (
                          <div className="mt-2.5 flex max-w-md items-center gap-3">
                            <div className="flex flex-1 gap-1">
                              {Array.from({ length: count }, (_, index) => {
                                const step = index + 1;
                                const filled = step <= partsDone;
                                return (
                                  <button
                                    key={step}
                                    type="button"
                                    disabled={busy}
                                    aria-label={t('tasks.splitPart', { n: step, count })}
                                    onClick={() => onSetPart(task, partsDone === step ? step - 1 : step)}
                                    className={`h-2 flex-1 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                                      filled ? 'bg-brand-500' : 'bg-ink/[0.09] hover:bg-brand-500/40'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-xs font-semibold text-brand-500 tabular-nums">
                              {t('tasks.splitProgress', { done: partsDone, count })}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              className="text-xs font-medium text-muted transition hover:text-ink"
                              onClick={() => onSplit(task, 1)}
                            >
                              {t('tasks.unsplit')}
                            </button>
                          </div>
                        ) : null}

                        {picking ? (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-xs font-medium text-muted">{t('tasks.splitHint')}</span>
                            {SPLIT_CHOICES.map((choice) => (
                              <button
                                key={choice}
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setPickingId(null);
                                  onSplit(task, choice);
                                }}
                                className="h-7 min-w-7 rounded-lg bg-panel px-1.5 text-xs font-semibold text-ink ring-1 ring-line transition hover:bg-brand-500 hover:text-on-brand hover:ring-brand-500"
                              >
                                {choice}
                              </button>
                            ))}
                            <button type="button" className="ml-1 text-xs font-medium text-muted hover:text-ink" onClick={() => setPickingId(null)}>
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* Fixed-width slot, chip at its right edge: times line up in one column. */}
                      <span className="mt-0.5 flex w-28 shrink-0 justify-end">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-ink/[0.05] px-2 py-1 text-xs font-medium whitespace-nowrap text-muted tabular-nums">
                          <Timer className="h-3.5 w-3.5" aria-hidden />
                          {formatMinutes(task.minutes, t)}
                        </span>
                      </span>

                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-focus-within/task:opacity-100 group-hover/task:opacity-100 pointer-coarse:opacity-100">
                        <button
                          type="button"
                          aria-pressed={Boolean(task.important)}
                          aria-label={task.important ? t('tasks.unmarkImportant') : t('tasks.markImportant')}
                          title={task.important ? t('tasks.unmarkImportant') : t('tasks.markImportant')}
                          disabled={busy}
                          onClick={() => onImportant(task)}
                          className={`${iconButton} ${task.important ? 'text-brand-500' : ''}`}
                        >
                          <Flag className={`h-4 w-4 ${task.important ? 'fill-current' : ''}`} aria-hidden />
                        </button>
                        {/* A split task keeps an empty slot here, so the row's actions keep their width. */}
                        {count > 1 ? <span className="h-8 w-8" aria-hidden /> : (
                          <button
                            type="button"
                            aria-expanded={picking}
                            aria-label={t('tasks.split')}
                            title={t('tasks.split')}
                            disabled={busy}
                            onClick={() => setPickingId(picking ? null : task.id)}
                            className={`${iconButton} ${picking ? 'bg-brand-500/10 text-brand-500' : ''}`}
                          >
                            <Split className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                        <button type="button" aria-label={t('tasks.edit')} title={t('tasks.edit')} disabled={busy} onClick={() => onEdit(task)} className={iconButton}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={t('common.delete')}
                          title={t('common.delete')}
                          disabled={busy}
                          onClick={() => onDelete(task.id)}
                          className={`${iconButton} hover:!bg-red-500/10 hover:!text-red-400`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form className="flex items-center gap-2 border-t border-line bg-ink/[0.015] px-5 py-3" onSubmit={(event) => void submit(event)}>
            <Plus className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('tasks.board.add')}
              aria-label={t('tasks.taskTitle')}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-muted"
            />
            <label className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-muted ring-1 ring-line focus-within:ring-brand-400">
              <Timer className="h-3.5 w-3.5" aria-hidden />
              <input
                type="number"
                min={1}
                max={24 * 60}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                aria-label={t('tasks.minutes')}
                className="w-10 [appearance:textfield] bg-transparent text-right text-sm text-ink tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-xs">{t('tasks.minShort')}</span>
            </label>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="inline-flex h-9 shrink-0 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-on-brand transition hover:brightness-110 disabled:opacity-40"
            >
              {t('tasks.saveTask')}
            </button>
          </form>
          {formError ? (
            <div className="px-5 pb-3">
              <ErrorMessage message={formError} />
            </div>
          ) : null}
        </section>
      </div>

      {/* Side: month calendar and month stats. */}
      {/* Beside the list on wide screens; below it, calendar and stats sit side by side. */}
      <aside className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-1">
        <section className="dash-card rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={iconButton} aria-label={t('tasks.board.prevMonth')} onClick={() => goMonth(-1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm font-semibold text-ink capitalize">{formatMonthTitle(year, month, language)}</p>
            <button type="button" className={iconButton} aria-label={t('tasks.board.nextMonth')} onClick={() => goMonth(1)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {labels.map((label) => (
              <span key={label} className="pb-1 text-[11px] font-medium text-muted capitalize">
                {label}
              </span>
            ))}
            {cells.map((cell) => {
              if (!cell.inMonth) return <span key={cell.date} />;
              const stats = tally(byDate.get(cell.date) ?? []);
              const selected = cell.date === date;
              const isToday = cell.date === today;
              const complete = stats.total > 0 && stats.done === stats.total;
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onDateChange(cell.date)}
                  aria-pressed={selected}
                  title={stats.total ? `${stats.done}/${stats.total}` : undefined}
                  className={`relative flex h-9 flex-col items-center justify-center rounded-xl text-xs font-medium tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    selected
                      ? 'bg-brand-500 text-on-brand'
                      : complete
                        ? 'bg-brand-500/15 text-brand-500 hover:bg-brand-500/25'
                        : isToday
                          ? 'text-brand-500 ring-1 ring-brand-500/60'
                          : 'text-ink hover:bg-brand-500/[0.08]'
                  }`}
                >
                  {cell.day}
                  {stats.total && !complete ? (
                    <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-on-brand' : 'bg-brand-500/70'}`} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="dash-card rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink capitalize">{formatMonthTitle(year, month, language)}</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 transition hover:underline"
              onClick={onYearView}
            >
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {t('tasks.day.yearView')}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <Ring percent={month_.percent} className="h-16 w-16" />
              <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-ink tabular-nums">{month_.percent}%</span>
            </div>
            <div>
              <p className="text-xl font-semibold text-ink tabular-nums">
                {month_.done} <span className="text-sm font-medium text-muted">/ {month_.total}</span>
              </p>
              <p className="text-xs text-muted">{t('tasks.board.monthDone')}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-ink/[0.04] px-3 py-2.5">
              <dt className="text-[11px] text-muted">{t('tasks.board.activeDays')}</dt>
              <dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">{month_.activeDays}</dd>
            </div>
            <div className="rounded-2xl bg-ink/[0.04] px-3 py-2.5">
              <dt className="text-[11px] text-muted">{t('tasks.day.perfectDays')}</dt>
              <dd className="mt-0.5 text-base font-semibold text-brand-500 tabular-nums">{month_.perfect}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
