import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NoteForm } from '@/components/notes/NoteForm';
import { SnippetComposer } from '@/components/notes/SnippetComposer';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useNote, useUpdateNote } from '@/features/notes/useNotes';
import { isSnippetNote } from '@/types/note';

export function NoteEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: note, isLoading, isError } = useNote(id);
  const updateNote = useUpdateNote();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  if (isLoading) return <Loader />;
  if (isError || !note) return <ErrorMessage message={t('notes.notFound')} />;

  const goBack = () => {
    void navigate(`/notes/${note.id}`);
  };

  const snippet = isSnippetNote(note);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {snippet ? t('notes.snippetEditTitle') : t('notes.editTitle')}
          </h1>
          {snippet ? (
            <p className="mt-1 text-sm text-muted">{t('notes.snippetHint')}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">{note.title}</p>
          )}
        </div>
        <Button variant="secondary" type="button" onClick={goBack} className="w-full sm:w-auto">
          {t('common.cancel')}
        </Button>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        {snippet ? (
          <SnippetComposer
            initialContent={note.content}
            submitLabel={t('notes.saveChanges')}
            cancelLabel={t('common.cancel')}
            isSubmitting={updateNote.isPending}
            errorMessage={errorMessage}
            onCancel={goBack}
            onSubmit={async (content) => {
              if (updateNote.isPending) return;
              setErrorMessage(undefined);
              try {
                await updateNote.mutateAsync({ id: note.id, payload: { content } });
                void navigate(`/notes/${note.id}`);
              } catch {
                setErrorMessage(t('auth.errors.generic'));
              }
            }}
          />
        ) : (
          <NoteForm
            initialNote={note}
            submitLabel={t('notes.saveChanges')}
            cancelLabel={t('common.cancel')}
            isSubmitting={updateNote.isPending}
            errorMessage={errorMessage}
            onCancel={goBack}
            onSubmit={async (payload) => {
              if (updateNote.isPending) return;
              setErrorMessage(undefined);
              try {
                await updateNote.mutateAsync({ id: note.id, payload });
                void navigate(`/notes/${note.id}`);
              } catch {
                setErrorMessage(t('auth.errors.generic'));
              }
            }}
          />
        )}
      </section>
    </div>
  );
}
