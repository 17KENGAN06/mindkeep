import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FormattedText } from '@/components/ui/FormattedText';
import { SourceLink } from '@/components/ui/SourceLink';
import { Loader } from '@/components/ui/Loader';
import {
  useArchiveMaterial,
  useDeleteMaterial,
  useMaterial,
} from '@/features/materials/useMaterials';
import type { AppLanguage } from '@/i18n';
import { formatDate } from '@/utils/date';

export function MaterialDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { data: material, isLoading, isError } = useMaterial(id);
  const archiveMaterial = useArchiveMaterial();
  const deleteMaterial = useDeleteMaterial();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <Loader />;
  if (isError || !material) return <ErrorMessage message={t('auth.errors.generic')} />;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{material.title}</h1>
            <Badge tone={material.status === 'ARCHIVED' ? 'neutral' : 'success'}>
              {t(`materials.status.${material.status}`)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t('materials.learnedAt')}: {formatDate(material.learnedAt, language)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/materials/${material.id}/edit`}>
            <Button variant="secondary">{t('common.edit')}</Button>
          </Link>
          {material.status !== 'ARCHIVED' ? (
            <Button
              variant="secondary"
              type="button"
              isLoading={archiveMaterial.isPending}
              onClick={() => void archiveMaterial.mutateAsync(material.id)}
            >
              {t('materials.archive')}
            </Button>
          ) : null}
          <Button variant="ghost" type="button" onClick={() => setConfirmDelete(true)}>
            {t('common.delete')}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        {material.category ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-3.5 py-2 ring-1 ring-line">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              {t('materials.fields.category')}
            </span>
            <span className="text-sm font-semibold text-ink">{material.category.name}</span>
          </div>
        ) : null}

        {material.content?.trim() ? (
          <div>
            <div className="rounded-2xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
              <p className="text-base font-semibold text-ink">{t('materials.fields.content')}</p>
            </div>
            <div className="mt-4">
              <FormattedText text={material.content} />
            </div>
          </div>
        ) : null}

        {material.sourceUrl ? (
          <div>
            <div className="rounded-2xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
              <p className="text-base font-semibold text-ink">{t('materials.fields.sourceUrl')}</p>
            </div>
            <SourceLink href={material.sourceUrl} actionLabel={t('materials.openSource')} />
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('materials.remindersTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('materials.remindersSubtitle')}</p>
        <ul className="mt-4 space-y-2">
          {material.reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm"
            >
              <span>
                #{reminder.sequenceNumber} · {t(`materials.intervals.${reminder.intervalType}`)}
              </span>
              <span className="text-muted">{formatDate(reminder.scheduledAt, language)}</span>
              <Badge
                tone={
                  reminder.status === 'COMPLETED'
                    ? 'success'
                    : reminder.status === 'OVERDUE'
                      ? 'danger'
                      : reminder.status === 'SKIPPED'
                        ? 'neutral'
                        : 'warning'
                }
              >
                {t(`materials.reminderStatus.${reminder.status}`)}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title={t('materials.deleteTitle')}
        description={t('materials.deleteDescription', { title: material.title })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteMaterial.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void deleteMaterial.mutateAsync(material.id).then(() => {
            void navigate('/materials');
          });
        }}
      />
    </div>
  );
}
