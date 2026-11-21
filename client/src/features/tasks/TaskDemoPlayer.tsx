import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Clapperboard, Play, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dailyTasksApi } from '@/api/dailyTasks';
import { sortDailyTasks } from '@/components/tasks/DailyTaskList';
import type { DailyTask } from '@/types/dailyTask';

const tasksKey = ['daily-tasks'] as const;
const COUNTDOWN_MS = 1000;
const MAX_MONTHS = 12;
/** Ticks per second the admin can pick; remembered in this browser. */
const SPEEDS = [1, 2, 3, 5] as const;
type Speed = (typeof SPEEDS)[number];
const SPEED_KEY = 'lr_demo_speed';

function savedSpeed(): Speed {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY));
    return (SPEEDS as readonly number[]).includes(value) ? (value as Speed) : 3;
  } catch {
    return 3;
  }
}

type Phase = 'idle' | 'loading' | 'countdown' | 'running' | 'done';

type TaskDemoPlayerProps = {
  today: string;
  /** Shows the day being ticked (the boards follow it). */
  onFocusDay: (date: string) => void;
};

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function monthsBetween(from: string, to: string) {
  const start = Number(from.slice(0, 4)) * 12 + Number(from.slice(5, 7)) - 1;
  const end = Number(to.slice(0, 4)) * 12 + Number(to.slice(5, 7)) - 1;
  const list: { year: number; month: number }[] = [];
  for (let index = start; index <= end; index += 1) {
    list.push({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  }
  return list;
}

function markDone(old: unknown, id: string): unknown {
  if (!old || typeof old !== 'object' || !('tasks' in old)) return old;
  const data = old as { tasks: DailyTask[] };
  if (!Array.isArray(data.tasks)) return old;
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === id ? { ...task, completed: true, splitDone: Math.max(1, task.splitCount ?? 1) } : task,
    ),
  };
}

/**
 * Admin-only helper for recording videos: ticks the open tasks of a date range one by one,
 * day by day and top to bottom, one tick per second. Esc or Stop ends it at any moment.
 * It only uses the normal task update API, so it can touch nothing but the admin's own tasks.
 */
export function TaskDemoPlayer({ today, onFocusDay }: TaskDemoPlayerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(3);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [speed, setSpeedState] = useState<Speed>(savedSpeed);
  const setSpeed = (next: Speed) => {
    setSpeedState(next);
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  };
  const stopRef = useRef(false);
  const focusRef = useRef(onFocusDay);
  useEffect(() => {
    focusRef.current = onFocusDay;
  }, [onFocusDay]);

  const busy = phase === 'loading' || phase === 'countdown' || phase === 'running';

  const stop = useCallback(() => {
    stopRef.current = true;
  }, []);

  useEffect(() => {
    if (!busy) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, stop]);

  // Leaving the page stops the run.
  useEffect(() => () => stop(), [stop]);

  const run = async () => {
    setMessage(null);
    if (from > to) {
      setMessage(t('tasks.demo.badRange'));
      return;
    }
    const months = monthsBetween(from, to);
    if (months.length > MAX_MONTHS) {
      setMessage(t('tasks.demo.tooLong'));
      return;
    }
    stopRef.current = false;
    setPhase('loading');
    let queue: DailyTask[];
    try {
      const results = await Promise.all(
        months.map((item) => dailyTasksApi.getPeriod({ view: 'month', ...item })),
      );
      const byDate = new Map<string, DailyTask[]>();
      for (const task of results.flatMap((result) => result.tasks)) {
        if (task.date < from || task.date > to) continue;
        const list = byDate.get(task.date);
        if (list) list.push(task);
        else byDate.set(task.date, [task]);
      }
      queue = Array.from(byDate.keys())
        .sort()
        .flatMap((date) => sortDailyTasks(byDate.get(date)!))
        .filter((task) => !task.completed);
    } catch {
      setPhase('idle');
      setMessage(t('auth.errors.generic'));
      return;
    }
    if (queue.length === 0) {
      setPhase('idle');
      setMessage(t('tasks.demo.empty'));
      return;
    }

    setOpen(false);
    setDone(0);
    setTotal(queue.length);
    focusRef.current(queue[0]!.date);
    setPhase('countdown');
    for (let n = 3; n > 0; n -= 1) {
      if (stopRef.current) break;
      setCountdown(n);
      await sleep(COUNTDOWN_MS);
    }

    setPhase('running');
    const step = 1000 / speed;
    const ticked = new Set<string>();
    // Saves run in the background so fast speeds are not held up by the network. A day or month
    // loaded meanwhile could still show some of them unticked, so ticks are put back on new data.
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success' || ticked.size === 0) return;
      const key = event.query.queryKey;
      if (key[0] !== tasksKey[0]) return;
      const data = event.query.state.data as { tasks?: DailyTask[] } | undefined;
      if (!data?.tasks?.some((task) => ticked.has(task.id) && !task.completed)) return;
      queryClient.setQueryData(key, (old: unknown) => {
        let next = old;
        for (const id of ticked) next = markDone(next, id);
        return next;
      });
    });
    const saves: Promise<unknown>[] = [];
    let failed = false;
    let count = 0;
    let shownDate = queue[0]!.date;
    try {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      for (const task of queue) {
        if (stopRef.current || failed) break;
        const started = Date.now();
        if (task.date !== shownDate) {
          shownDate = task.date;
          focusRef.current(task.date);
          // Let the new day appear before its first tick.
          await sleep(Math.max(250, step / 2));
          if (stopRef.current) break;
        }
        ticked.add(task.id);
        queryClient.setQueriesData({ queryKey: tasksKey }, (old: unknown) => markDone(old, task.id));
        document.getElementById(`task-${task.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        count += 1;
        setDone(count);
        saves.push(
          dailyTasksApi.update(task.id, { completed: true }).catch(() => {
            failed = true;
          }),
        );
        const left = step - (Date.now() - started);
        if (left > 0) await sleep(left);
      }
      await Promise.all(saves);
    } finally {
      unsubscribe();
    }
    if (failed) setMessage(t('auth.errors.generic'));

    void queryClient.invalidateQueries({ queryKey: tasksKey });
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setPhase('done');
    await sleep(2500);
    setPhase((current) => (current === 'done' ? 'idle' : current));
  };

  const inputClass =
    'h-10 w-full rounded-xl bg-canvas px-3 text-sm text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <>
      <div className="relative">
        <button
          type="button"
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-muted ring-1 ring-line transition hover:text-ink disabled:opacity-50"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Clapperboard className="h-4 w-4" aria-hidden />
          {t('tasks.demo.button')}
        </button>

        {open ? (
          <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl bg-panel p-4 shadow-xl ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{t('tasks.demo.title')}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{t('tasks.demo.hint')}</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-muted transition hover:text-ink"
                aria-label={t('tasks.demo.close')}
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-muted">
                {t('tasks.demo.from')}
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                {t('tasks.demo.to')}
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-muted">{t('tasks.demo.speed')}</p>
              <div className="mt-1 grid grid-cols-4 gap-1 rounded-xl bg-ink/[0.04] p-1 ring-1 ring-line/60" role="group">
                {SPEEDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={speed === option}
                    className={`rounded-lg py-1.5 text-xs font-semibold tabular-nums transition ${
                      speed === option ? 'bg-brand-500 text-on-brand shadow-sm' : 'text-muted hover:text-ink'
                    }`}
                    onClick={() => setSpeed(option)}
                  >
                    {t('tasks.demo.perSecond', { count: option })}
                  </button>
                ))}
              </div>
            </div>
            {message ? <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{message}</p> : null}
            <button
              type="button"
              disabled={!from || !to || busy}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-on-brand shadow-sm transition hover:brightness-110 disabled:opacity-50"
              onClick={() => void run()}
            >
              <Play className="h-4 w-4" aria-hidden />
              {phase === 'loading' ? t('tasks.demo.loading') : t('tasks.demo.start')}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">{t('tasks.demo.escHint')}</p>
          </div>
        ) : null}
      </div>

      {phase === 'countdown' ? (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
          <span
            key={countdown}
            className="animate-[demo-pop_1s_ease-out_both] text-[9rem] leading-none font-bold text-brand-500 drop-shadow-xl tabular-nums"
          >
            {countdown}
          </span>
        </div>
      ) : null}

      {phase === 'running' || phase === 'countdown' || phase === 'done' ? (
        <div className="group fixed right-5 bottom-5 z-50 flex items-center gap-3 rounded-full bg-panel/95 py-1.5 pr-1.5 pl-4 text-sm shadow-lg ring-1 ring-line opacity-25 transition-opacity duration-300 hover:opacity-100">
          <span className="font-semibold text-ink tabular-nums">
            {phase === 'done' ? t('tasks.demo.finished', { count: done }) : `${done} / ${total}`}
          </span>
          {phase === 'done' ? null : (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink/[0.06] px-3 text-xs font-semibold text-ink transition hover:bg-ink/10"
              onClick={stop}
            >
              <Square className="h-3 w-3 fill-current" aria-hidden />
              {t('tasks.demo.stop')}
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}
