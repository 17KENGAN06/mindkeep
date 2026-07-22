import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AppLanguage } from '@/i18n';
import type { Reminder } from '@/types/reminder';
import { formatDate } from '@/utils/date';

type ReminderCardProps = {
  reminder: Reminder;
  isCompleting?: boolean;
  isSkipping?: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
};

export function ReminderCard({
  reminder,
  isCompleting = false,
  isSkipping = false,
  onComplete,
  onSkip,
}: ReminderCardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;

  return (
    <article className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">{reminder.material.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {reminder.material.category?.name ?? t('materials.fields.noCategory')}
          </p>
        </div>
        <Badge
          tone={
            reminder.status === 'OVERDUE'
              ? 'danger'
              : reminder.daysOverdue > 0
                ? 'danger'
                : 'warning'
          }
        >
          {t(`materials.reminderStatus.${reminder.status}`)}
        </Badge>
      </div>

      <dl className="mt-3 grid gap-1 text-sm text-muted">
        <div>
          <dt className="inline font-medium text-ink">{t('review.learnedAt')}: </dt>
          <dd className="inline">{formatDate(reminder.material.learnedAt, language)}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink">{t('review.sequence')}: </dt>
          <dd className="inline">
            #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink">{t('review.scheduledAt')}: </dt>
          <dd className="inline">{formatDate(reminder.scheduledAt, language)}</dd>
        </div>
        {reminder.daysOverdue > 0 ? (
          <div>
            <dt className="inline font-medium text-ink">{t('review.daysOverdue')}: </dt>
            <dd className="inline text-red-700">{reminder.daysOverdue}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/materials/${reminder.material.id}`}>
          <Button variant="secondary" type="button">
            {t('review.openMaterial')}
          </Button>
        </Link>
        <Button
          type="button"
          isLoading={isCompleting}
          onClick={() => onComplete(reminder.id)}
        >
          {t('review.completed')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          isLoading={isSkipping}
          onClick={() => onSkip(reminder.id)}
        >
          {t('review.skip')}
        </Button>
      </div>
    </article>
  );
}
