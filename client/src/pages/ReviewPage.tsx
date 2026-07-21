import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import {
  useCompleteReminder,
  useOverdueReminders,
  useSkipReminder,
  useTodayReminders,
  useUpcomingReminders,
} from '@/features/reminders/useReminders';
import type { Reminder } from '@/types/reminder';

function ReminderSection({
  title,
  reminders,
  emptyTitle,
  emptyDescription,
  pendingId,
  action,
  onComplete,
  onSkip,
  completePending,
  skipPending,
}: {
  title: string;
  reminders: Reminder[] | undefined;
  emptyTitle: string;
  emptyDescription: string;
  pendingId: string | null;
  action: 'complete' | 'skip' | null;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  completePending: boolean;
  skipPending: boolean;
}) {
  if (!reminders) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-ink">
        {title}{' '}
        <span className="text-sm font-normal text-muted">({reminders.length})</span>
      </h2>

      {reminders.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              isCompleting={completePending && pendingId === reminder.id && action === 'complete'}
              isSkipping={skipPending && pendingId === reminder.id && action === 'skip'}
              onComplete={onComplete}
              onSkip={onSkip}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ReviewPage() {
  const { t } = useTranslation();
  const overdueQuery = useOverdueReminders();
  const todayQuery = useTodayReminders();
  const upcomingQuery = useUpcomingReminders();
  const completeReminder = useCompleteReminder();
  const skipReminder = useSkipReminder();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [action, setAction] = useState<'complete' | 'skip' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = overdueQuery.isLoading || todayQuery.isLoading || upcomingQuery.isLoading;
  const isError = overdueQuery.isError || todayQuery.isError || upcomingQuery.isError;

  const handleComplete = async (id: string) => {
    setPendingId(id);
    setAction('complete');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await completeReminder.mutateAsync(id);
      setSuccessMessage(t('review.successCompleted'));
    } catch {
      setErrorMessage(t('auth.errors.generic'));
    } finally {
      setPendingId(null);
      setAction(null);
    }
  };

  const handleSkip = async (id: string) => {
    setPendingId(id);
    setAction('skip');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await skipReminder.mutateAsync(id);
      setSuccessMessage(t('review.successSkipped'));
    } catch {
      setErrorMessage(t('auth.errors.generic'));
    } finally {
      setPendingId(null);
      setAction(null);
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <ErrorMessage message={t('auth.errors.generic')} />;

  const totalOpen =
    (overdueQuery.data?.length ?? 0) +
    (todayQuery.data?.length ?? 0);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('review.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('review.subtitle')}</p>
        <p className="mt-2 text-sm font-medium text-brand-800">
          {t('review.openCount', { count: totalOpen })}
        </p>
      </section>

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}
      <ErrorMessage message={errorMessage ?? undefined} />

      <ReminderSection
        title={t('review.overdue')}
        reminders={overdueQuery.data}
        emptyTitle={t('review.emptyOverdueTitle')}
        emptyDescription={t('review.emptyOverdueDescription')}
        pendingId={pendingId}
        action={action}
        onComplete={(id) => void handleComplete(id)}
        onSkip={(id) => void handleSkip(id)}
        completePending={completeReminder.isPending}
        skipPending={skipReminder.isPending}
      />

      <ReminderSection
        title={t('review.today')}
        reminders={todayQuery.data}
        emptyTitle={t('review.emptyTodayTitle')}
        emptyDescription={t('review.emptyTodayDescription')}
        pendingId={pendingId}
        action={action}
        onComplete={(id) => void handleComplete(id)}
        onSkip={(id) => void handleSkip(id)}
        completePending={completeReminder.isPending}
        skipPending={skipReminder.isPending}
      />

      <ReminderSection
        title={t('review.upcoming')}
        reminders={upcomingQuery.data}
        emptyTitle={t('review.emptyUpcomingTitle')}
        emptyDescription={t('review.emptyUpcomingDescription')}
        pendingId={pendingId}
        action={action}
        onComplete={(id) => void handleComplete(id)}
        onSkip={(id) => void handleSkip(id)}
        completePending={completeReminder.isPending}
        skipPending={skipReminder.isPending}
      />
    </div>
  );
}
