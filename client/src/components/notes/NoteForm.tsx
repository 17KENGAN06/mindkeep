import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createNoteFormSchema, type NoteFormValues } from '@/schemas/note';
import type { Note } from '@/types/note';

type NoteFormProps = {
  initialNote?: Note;
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  errorMessage?: string;
  isSubmitting?: boolean;
  onSubmit: (payload: { title: string; content: string; sourceUrl: string | null }) => Promise<void>;
};

export function NoteForm({
  initialNote,
  submitLabel,
  cancelLabel,
  onCancel,
  errorMessage,
  isSubmitting = false,
  onSubmit,
}: NoteFormProps) {
  const { t } = useTranslation();
  const schema = createNoteFormSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialNote?.title ?? '',
      content: initialNote?.content ?? '',
      sourceUrl: initialNote?.sourceUrl ?? '',
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          const source = values.sourceUrl.trim();
          await onSubmit({
            title: values.title.trim(),
            content: values.content,
            sourceUrl: source ? source : null,
          });
        })(event);
      }}
    >
      <Input
        label={t('notes.fields.title')}
        placeholder={t('notes.placeholders.title')}
        error={errors.title?.message}
        autoComplete="off"
        {...register('title')}
      />
      <Textarea
        label={t('notes.fields.content')}
        placeholder={t('notes.placeholders.content')}
        error={errors.content?.message}
        rows={14}
        className="min-h-64 sm:min-h-80"
        {...register('content')}
      />
      <Input
        label={t('notes.fields.sourceUrl')}
        placeholder={t('notes.placeholders.sourceUrl')}
        hint={t('notes.fields.sourceHint')}
        error={errors.sourceUrl?.message}
        inputMode="url"
        autoComplete="url"
        {...register('sourceUrl')}
      />
      <ErrorMessage message={errorMessage} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
          {cancelLabel}
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
