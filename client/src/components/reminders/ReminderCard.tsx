import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnswerReveal } from '@/components/materials/AnswerReveal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormattedText } from '@/components/ui/FormattedText';
import type { AppLanguage } from '@/i18n';
import type { Reminder } from '@/types/reminder';
import { formatDate } from '@/utils/date';

type ReminderCardProps = {
  reminder: Reminder;
  isCompleting?: boolean;
  isSkipping?: boolean;
  canResolve?: boolean;
  actionsDisabled?: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
};

export function ReminderCard({
  reminder,
  isCompleting = false,
  isSkipping = false,
  canResolve = true,
  actionsDisabled = false,
  onComplete,
  onSkip,
}: ReminderCardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { material } = reminder;
  const hasFlashcard = Boolean(material.question?.trim() && material.answer?.trim());

  return (
    <article className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">{material.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {material.category?.name ?? t('materials.fields.noCategory')}
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
          <dd className="inline">{formatDate(material.learnedAt, language)}</dd>
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

      {hasFlashcard ? (
        <div className="mt-4">
          <AnswerReveal question={material.question!} answer={material.answer!} />
        </div>
      ) : null}

      {!hasFlashcard && material.content?.trim() ? (
        <div className="mt-4 rounded-2xl bg-brand-50/30 px-4 py-4 ring-1 ring-line/70">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t('materials.fields.content')}
          </p>
          <div className="mt-2">
            <FormattedText text={material.content} />
          </div>
        </div>
      ) : null}

      {hasFlashcard && material.content?.trim() ? (
        <details className="mt-4 rounded-2xl bg-brand-50/20 px-4 py-3 ring-1 ring-line/60">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            {t('materials.showNotes')}
          </summary>
          <div className="mt-3">
            <FormattedText text={material.content} />
          </div>
        </details>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/materials/${material.id}`}>
          <Button variant="secondary" type="button">
            {t('review.openMaterial')}
          </Button>
        </Link>
        {canResolve ? (
          <>
            <Button
              type="button"
              isLoading={isCompleting}
              loadingText={t('review.processing')}
              disabled={actionsDisabled}
              onClick={() => onComplete(reminder.id)}
            >
              {t('review.completed')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              isLoading={isSkipping}
              loadingText={t('review.processing')}
              disabled={actionsDisabled}
              onClick={() => onSkip(reminder.id)}
            >
              {t('review.skip')}
            </Button>
          </>
        ) : (
          <p className="flex min-h-11 items-center text-sm text-muted">{t('review.notDue')}</p>
        )}
      </div>
    </article>
  );
}
