import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import type { DailyTask } from '@/types/dailyTask';

type TaskEditDialogProps = {
  /** The task being edited; null keeps the dialog closed. */
  task: DailyTask | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: { title: string; minutes: number }) => void;
};

/** Rename a task or change its minutes in a dialog over the list (app: features/tasks/TaskEditModal). */
export function TaskEditDialog({ task, isLoading = false, error, onClose, onSave }: TaskEditDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Load the task's values each time a (different) task is opened (adjusted during render).
  const [openedId, setOpenedId] = useState<string | null>(null);
  const taskId = task?.id ?? null;
  if (taskId !== openedId) {
    setOpenedId(taskId);
    if (task) {
      setTitle(task.title);
      setMinutes(String(task.minutes));
      setLocalError(null);
    }
  }

  useLockBodyScroll(task !== null);
  if (!task) return null;

  const shownError = localError ?? error;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 overscroll-none sm:items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-edit-title"
        className="w-full max-w-md space-y-4 rounded-2xl bg-panel p-5 shadow-lg"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const mins = Number(minutes);
          if (!title.trim()) {
            setLocalError(t('tasks.errors.title'));
            return;
          }
          if (!Number.isFinite(mins) || mins < 1) {
            setLocalError(t('tasks.errors.minutes'));
            return;
          }
          setLocalError(null);
          onSave({ title: title.trim(), minutes: Math.round(mins) });
        }}
      >
        <h2 id="task-edit-title" className="text-lg font-semibold text-ink">
          {t('tasks.edit')}
        </h2>
        <Input
          id="task-edit-name"
          label={t('tasks.taskTitle')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
          autoComplete="off"
        />
        <Input
          id="task-edit-minutes"
          label={t('tasks.minutes')}
          type="number"
          min="1"
          max="1440"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
        <ErrorMessage message={shownError ?? undefined} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
