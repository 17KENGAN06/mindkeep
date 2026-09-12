import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NoteForm } from '@/components/notes/NoteForm';
import { Button } from '@/components/ui/Button';
import { useCreateNote } from '@/features/notes/useNotes';

export function NoteCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createNote = useCreateNote();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const goBack = () => {
    void navigate('/notes');
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notes.createTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notes.createSubtitle')}</p>
        </div>
        <Button variant="secondary" type="button" onClick={goBack} className="w-full sm:w-auto">
          {t('notes.backToNotes')}
        </Button>
      </section>

      <section className="mx-auto w-full max-w-4xl rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <NoteForm
          submitLabel={t('notes.save')}
          cancelLabel={t('common.cancel')}
          isSubmitting={createNote.isPending}
          errorMessage={errorMessage}
          onCancel={goBack}
          onSubmit={async (payload) => {
            if (createNote.isPending) return;
            setErrorMessage(undefined);
            try {
              const result = await createNote.mutateAsync(payload);
              void navigate(`/notes/${result.note.id}`);
            } catch {
              setErrorMessage(t('auth.errors.generic'));
            }
          }}
        />
      </section>
    </div>
  );
}
