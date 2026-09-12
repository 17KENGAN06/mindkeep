import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import type { AppLanguage } from '@/i18n';
import type { Note } from '@/types/note';
import { formatDate } from '@/utils/date';
import { sourceHost } from '@/utils/url';

type NoteCardProps = {
  note: Note;
};

export function NoteCard({ note }: NoteCardProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const preview = note.content.trim();
  const host = note.sourceUrl ? sourceHost(note.sourceUrl) : null;

  return (
    <Link
      to={`/notes/${note.id}`}
      className="flex h-full min-w-0 cursor-pointer flex-col rounded-2xl bg-panel px-4 py-4 no-underline shadow-sm ring-1 ring-line transition hover:ring-brand-300"
    >
      <h2 className="line-clamp-2 break-words text-base font-semibold text-ink">{note.title}</h2>
      {preview ? (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted">{preview}</p>
      ) : null}
      <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted">
        <span>{formatDate(note.createdAt, language)}</span>
        {host ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <Link2 className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{host}</span>
            <span className="sr-only">{t('notes.source')}</span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}
