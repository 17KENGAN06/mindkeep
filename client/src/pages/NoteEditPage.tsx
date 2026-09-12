import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NoteForm } from '@/components/notes/NoteForm';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useNote, useUpdateNote } from '@/features/notes/useNotes';

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

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notes.editTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{note.title}</p>
        </div>
        <Button variant="secondary" type="button" onClick={goBack} className="w-full sm:w-auto">
          {t('common.cancel')}
        </Button>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
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
      </section>
    </div>
  );
}
