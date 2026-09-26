import { useState } from 'react';
import { Check, Split, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyTask } from '@/types/dailyTask';

const SPLIT_CHOICES = [2, 3, 4, 5, 6, 7, 8] as const;

type TaskListProps = {
  tasks: DailyTask[];
  onToggle: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  onSplit: (task: DailyTask, splitCount: number) => void;
  onSetPart: (task: DailyTask, splitDone: number) => void;
  busyId?: string | null;
};

function formatMinutes(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return t('tasks.durationHoursMinutes', { hours, minutes: rest });
  if (hours > 0) return t('tasks.durationHours', { hours });
  return t('tasks.durationMinutes', { minutes });
}

function splitOf(task: DailyTask) {
  const count = Math.max(1, task.splitCount ?? 1);
  const done = Math.min(count, Math.max(0, task.splitDone ?? 0));
  return { count, done, split: count > 1 };
}

export function DailyTaskList({
  tasks,
  onToggle,
  onDelete,
  onSplit,
  onSetPart,
  busyId,
}: TaskListProps) {
  const { t } = useTranslation();
  const [pickingId, setPickingId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-brand-50/40 px-4 py-10 text-center">
        <p className="text-sm font-medium text-ink">{t('tasks.emptyDay')}</p>
        <p className="mt-1 text-sm text-muted">{t('tasks.emptyDayHint')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const parts = splitOf(task);
        const picking = pickingId === task.id;
        const busy = busyId === task.id;

        return (
          <li
            key={task.id}
            className={`flex flex-col gap-3 rounded-2xl p-3 ring-1 transition sm:p-4 ${
              task.completed ? 'bg-emerald-500/10 ring-emerald-500/30' : 'bg-panel ring-line'
            }`}
          >
            <div className="flex items-stretch gap-3">
              <button
                type="button"
                className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  task.completed
                    ? 'border-emerald-400 bg-emerald-500 text-[#07110d]'
                    : 'border-line bg-panel text-muted hover:border-brand-400 hover:text-brand-500'
                }`}
                aria-pressed={task.completed}
                aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
                disabled={busy}
                onClick={() => onToggle(task)}
              >
                <Check className="h-5 w-5" aria-hidden />
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p
                    className={`truncate text-base font-medium ${
                      task.completed ? 'text-emerald-400 line-through' : 'text-ink'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.note ? <p className="mt-0.5 truncate text-xs text-muted">{task.note}</p> : null}
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold sm:text-right ${
                    task.completed ? 'text-emerald-400' : 'text-brand-500'
                  }`}
                >
                  {formatMinutes(task.minutes, t)}
                </p>
              </div>

              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                aria-label={t('common.delete')}
                disabled={busy}
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {parts.split ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 pl-0 sm:pl-14">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {Array.from({ length: parts.count }, (_, index) => {
                    const step = index + 1;
                    const filled = step <= parts.done;
                    return (
                      <button
                        key={step}
                        type="button"
                        disabled={busy}
                        aria-label={t('tasks.splitPart', { n: step, count: parts.count })}
                        onClick={() => onSetPart(task, parts.done === step ? step - 1 : step)}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                          filled
                            ? 'bg-brand-500 text-[#07110d] shadow-sm'
                            : 'bg-line/50 text-muted hover:bg-brand-100 hover:text-ink'
                        }`}
                      >
                        {step}
                      </button>
                    );
                  })}
                  <span className="ml-1 text-sm font-semibold text-brand-500">
                    {t('tasks.splitProgress', { done: parts.done, count: parts.count })}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs font-medium text-muted transition hover:text-ink"
                  onClick={() => onSplit(task, 1)}
                >
                  {t('tasks.unsplit')}
                </button>
              </div>
            ) : picking ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 pl-0 sm:pl-14">
                <p className="text-xs font-medium text-muted">{t('tasks.splitHint')}</p>
                {SPLIT_CHOICES.map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPickingId(null);
                      onSplit(task, count);
                    }}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-ink ring-1 ring-line transition hover:bg-brand-500 hover:text-[#07110d]"
                  >
                    {count}
                  </button>
                ))}
                <button
                  type="button"
                  className="text-xs font-medium text-muted hover:text-ink"
                  onClick={() => setPickingId(null)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <div className="pl-0 sm:pl-14">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPickingId(task.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-semibold text-brand-500 ring-1 ring-line transition hover:bg-brand-100"
                >
                  <Split className="h-3.5 w-3.5" aria-hidden />
                  {t('tasks.split')}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
