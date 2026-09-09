import { Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyTask } from '@/types/dailyTask';

type TaskListProps = {
  tasks: DailyTask[];
  onToggle: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  busyId?: string | null;
};

function formatMinutes(minutes: number, t: (key: string, opts?: Record<string, unknown>) => string) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return t('tasks.durationHoursMinutes', { hours, minutes: rest });
  if (hours > 0) return t('tasks.durationHours', { hours });
  return t('tasks.durationMinutes', { minutes });
}

export function DailyTaskList({ tasks, onToggle, onDelete, busyId }: TaskListProps) {
  const { t } = useTranslation();

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
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`flex items-stretch gap-3 rounded-2xl p-3 ring-1 transition sm:p-4 ${
            task.completed
              ? 'bg-emerald-500/10 ring-emerald-500/30'
              : 'bg-panel ring-line'
          }`}
        >
          <button
            type="button"
            className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              task.completed
                ? 'border-emerald-400 bg-emerald-500 text-[#07110d]'
                : 'border-line bg-panel text-muted hover:border-brand-400 hover:text-brand-500'
            }`}
            aria-pressed={task.completed}
            aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
            disabled={busyId === task.id}
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
            disabled={busyId === task.id}
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
