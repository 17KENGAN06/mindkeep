import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Textarea } from '@/components/ui/Textarea';

type SnippetComposerProps = {
  initialContent?: string;
  submitLabel: string;
  cancelLabel: string;
  errorMessage?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  onCancel: () => void;
  onSubmit: (content: string) => Promise<void>;
};

export function SnippetComposer({
  initialContent = '',
  submitLabel,
  cancelLabel,
  errorMessage,
  isSubmitting = false,
  autoFocus = false,
  onCancel,
  onSubmit,
}: SnippetComposerProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [localError, setLocalError] = useState<string | undefined>();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (isSubmitting) return;
        if (!content.trim()) {
          setLocalError(t('notes.errors.contentRequired'));
          return;
        }
        setLocalError(undefined);
        void onSubmit(content);
      }}
    >
      <Textarea
        id="snippet-content"
        label={t('notes.fields.snippet')}
        hint={t('notes.snippetHint')}
        placeholder={t('notes.placeholders.snippet')}
        value={content}
        error={localError}
        autoFocus={autoFocus}
        rows={4}
        className="min-h-28"
        onChange={(event) => {
          setContent(event.target.value);
          if (localError) setLocalError(undefined);
        }}
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
