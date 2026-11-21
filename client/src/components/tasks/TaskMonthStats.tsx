import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CheckCircle2, Clock3, Flame, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyTask } from '@/types/dailyTask';

type TaskMonthStatsProps = {
  year: number;
  month: number;
  today: string;
  /** The month's tasks by day, with pending ticks already applied. */
  byDate: Map<string, DailyTask[]>;
};

/** Counts smoothly from the shown value to the new one. */
function useCountUp(value: number, duration = 600) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const started = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (value - from) * eased;
      fromRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return Math.round(shown);
}

function doneMinutes(task: DailyTask) {
  if (task.completed) return task.minutes;
  const parts = task.splitCount ?? 1;
  return parts > 1 ? Math.round((task.minutes * (task.splitDone ?? 0)) / parts) : 0;
}

function Tile({
  icon,
  value,
  label,
  accent,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-ink/[0.03] p-3 ring-1 ring-line/60">
      <div className="flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${accent}`}>{icon}</span>
        <p className="text-lg font-semibold text-ink tabular-nums">{value}</p>
      </div>
      <p className="mt-1.5 text-xs text-muted">{label}</p>
    </div>
  );
}

/**
 * Month summary above the board: a big completion figure, four tiles and a per-day chart
 * (planned vs done bars and a running completion line). Every figure animates when a task
 * is ticked, so the month visibly fills up.
 */
export function TaskMonthStats({ year, month, today, byDate }: TaskMonthStatsProps) {
  const { t } = useTranslation();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const stats = useMemo(() => {
    const days = Array.from({ length: dayCount }, (_, index) => {
      const date = `${prefix}-${String(index + 1).padStart(2, '0')}`;
      const list = byDate.get(date) ?? [];
      const done = list.filter((task) => task.completed).length;
      return { date, day: index + 1, total: list.length, done, perfect: list.length > 0 && done === list.length };
    });
    const total = days.reduce((sum, day) => sum + day.total, 0);
    const done = days.reduce((sum, day) => sum + day.done, 0);
    const tasks = Array.from(byDate.values()).flat();
    const minutes = tasks.reduce((sum, task) => sum + doneMinutes(task), 0);
    const perfect = days.filter((day) => day.perfect).length;
    let streak = 0;
    let run = 0;
    for (const day of days) {
      if (day.perfect) {
        run += 1;
        streak = Math.max(streak, run);
      } else if (day.total > 0) {
        run = 0;
      }
    }
    const max = Math.max(1, ...days.map((day) => day.total));
    // Running share of the month's tasks done by the end of each day.
    let running = 0;
    const line = days.map((day) => {
      running += day.done;
      return total ? running / total : 0;
    });
    return { days, total, done, minutes, perfect, streak, max, line };
  }, [byDate, dayCount, prefix]);

  const percent = stats.total ? (stats.done / stats.total) * 100 : 0;
  const shownPercent = useCountUp(Math.round(percent));
  const shownDone = useCountUp(stats.done);
  const shownMinutes = useCountUp(stats.minutes);
  const shownPerfect = useCountUp(stats.perfect);
  const shownStreak = useCountUp(stats.streak);

  // The line spans the bar centres (y grows downward in SVG) and stops at the last day with
  // something done; later points sit on that end point, so the point count stays the same and
  // the path can animate as days are ticked.
  const lastDone = Math.max(0, ...stats.days.filter((day) => day.done > 0).map((day) => day.day - 1));
  const x = (index: number) => ((Math.min(index, lastDone) + 0.5) / dayCount) * 100;
  const path = stats.line
    .map((_, index) => `${index === 0 ? 'M' : 'L'}${x(index)} ${100 - stats.line[Math.min(index, lastDone)]! * 100}`)
    .join(' ');
  const area = `${path} L${x(lastDone)} 100 L${x(0)} 100 Z`;
  const animated = (d: string) => ({ d: `path('${d}')`, transition: 'd 600ms ease-out' }) as CSSProperties;

  return (
    <div className="dash-card grid gap-6 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="flex flex-col">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t('tasks.board.monthDone')}</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="bg-gradient-to-br from-brand-500 to-brand-500/60 bg-clip-text text-6xl leading-none font-bold text-transparent tabular-nums">
            {shownPercent}%
          </span>
          <span className="mb-1.5 text-sm font-medium text-muted tabular-nums">
            {shownDone} / {stats.total}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-500/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500/70 to-brand-500 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Tile
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            accent="bg-brand-500/12 text-brand-500"
            value={shownDone}
            label={t('tasks.stats.done')}
          />
          <Tile
            icon={<Clock3 className="h-4 w-4" aria-hidden />}
            accent="bg-sky-500/12 text-sky-500"
            value={`${shownMinutes} ${t('tasks.minShort')}`}
            label={t('tasks.stats.minutes')}
          />
          <Tile
            icon={<Trophy className="h-4 w-4" aria-hidden />}
            accent="bg-amber-500/15 text-amber-500"
            value={shownPerfect}
            label={t('tasks.day.perfectDays')}
          />
          <Tile
            icon={<Flame className="h-4 w-4" aria-hidden />}
            accent="bg-rose-500/12 text-rose-500"
            value={shownStreak}
            label={t('tasks.stats.streak')}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">{t('tasks.stats.byDay')}</p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" aria-hidden />
              {t('tasks.stats.legendDone')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500/15" aria-hidden />
              {t('tasks.stats.legendPlanned')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-amber-500" aria-hidden />
              {t('tasks.stats.legendLine')}
            </span>
          </div>
        </div>

        <div className="relative mt-4 h-48 flex-1">
          {/* Guide lines at 25 / 50 / 75 %. */}
          {[25, 50, 75].map((line) => (
            <div
              key={line}
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/60"
              style={{ top: `${100 - line}%` }}
              aria-hidden
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {stats.days.map((day) => {
              const planned = (day.total / stats.max) * 100;
              const filled = day.total ? (day.done / day.total) * 100 : 0;
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  className="relative flex h-full min-w-0 flex-1 items-end"
                  title={`${day.day}: ${day.done} / ${day.total}`}
                >
                  <div
                    className={`relative w-full overflow-hidden rounded-t-md transition-[height] duration-500 ease-out ${
                      isToday ? 'bg-brand-500/25 ring-1 ring-brand-500/50' : 'bg-brand-500/12'
                    }`}
                    style={{ height: `${day.total ? Math.max(planned, 4) : 2}%` }}
                  >
                    <div
                      key={day.perfect ? 'perfect' : 'open'}
                      className={`absolute inset-x-0 bottom-0 rounded-t-md transition-[height] duration-500 ease-out ${
                        day.perfect
                          ? 'animate-[bar-glow_900ms_ease-out] bg-gradient-to-t from-brand-500 to-amber-400'
                          : 'bg-gradient-to-t from-brand-500/80 to-brand-500'
                      }`}
                      style={{ height: `${filled}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="month-line-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} style={animated(area)} fill="url(#month-line-fill)" />
            <path
              d={path}
              style={animated(path)}
              fill="none"
              stroke="rgb(245 158 11)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="mt-2 flex gap-[3px]">
          {stats.days.map((day) => (
            <span
              key={day.date}
              className={`min-w-0 flex-1 text-center text-[10px] tabular-nums ${
                day.date === today ? 'font-bold text-brand-500' : day.perfect ? 'font-semibold text-ink' : 'text-muted'
              }`}
            >
              {day.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
