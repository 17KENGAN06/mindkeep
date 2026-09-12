import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useDeleteNote, useNote } from '@/features/notes/useNotes';
import type { AppLanguage } from '@/i18n';
import { formatDate } from '@/utils/date';
import { sourceHost } from '@/utils/url';

export function NoteDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { data: note, isLoading, isError } = useNote(id);
  const deleteNote = useDeleteNote();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <Loader />;
  if (isError || !note) return <ErrorMessage message={t('notes.notFound')} />;

  const host = note.sourceUrl ? sourceHost(note.sourceUrl) : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/notes"
            className="inline-flex text-sm font-semibold text-brand-500 no-underline hover:underline"
          >
            ← {t('notes.backToNotes')}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-ink">{note.title}</h1>
          <p className="mt-1 text-sm text-muted">{formatDate(note.createdAt, language)}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to={`/notes/${note.id}/edit`} className="sm:shrink-0">
            <Button variant="secondary" className="w-full sm:w-auto">
              {t('common.edit')}
            </Button>
          </Link>
          <Button
            variant="ghost"
            type="button"
            className="w-full sm:w-auto"
            onClick={() => setConfirmDelete(true)}
          >
            {t('common.delete')}
          </Button>
        </div>
      </section>

      <article className="mx-auto w-full max-w-4xl space-y-6 rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line sm:p-6">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{note.content}</div>
        {note.sourceUrl ? (
          <div className="border-t border-line pt-4">
            <p className="text-sm font-semibold text-ink">{t('notes.source')}</p>
            <a
              href={note.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-sm text-brand-500"
            >
              {host ?? note.sourceUrl}
            </a>
          </div>
        ) : null}
      </article>

      <ConfirmDialog
        open={confirmDelete}
        title={t('notes.deleteTitle')}
        description={t('notes.deleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteNote.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (deleteNote.isPending) return;
          void deleteNote.mutateAsync(note.id).then(() => {
            void navigate('/notes');
          });
        }}
      />
    </div>
  );
}
