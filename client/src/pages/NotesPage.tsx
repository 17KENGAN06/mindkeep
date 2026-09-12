import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { NoteCard } from '@/components/notes/NoteCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { useNotes } from '@/features/notes/useNotes';
import type { NotesQuery } from '@/api/notes';

export function NotesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<NonNullable<NotesQuery['sort']>>('newest');

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      sort,
    }),
    [search, sort],
  );

  const { data: notes, isLoading, isError } = useNotes(query);
  const empty = !isLoading && !isError && notes && notes.length === 0;
  const noMatches = empty && Boolean(query.search);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notes.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('notes.subtitle')}</p>
        </div>
        <Link to="/notes/new" className="sm:shrink-0">
          <Button className="w-full sm:w-auto">{t('notes.create')}</Button>
        </Link>
      </section>

      <section className="grid gap-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:grid-cols-[1fr_11rem]">
        <Input
          label={t('notes.search')}
          placeholder={t('notes.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label={t('notes.sortLabel')}
          value={sort}
          onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}
          options={[
            { value: 'newest', label: t('notes.sortNewest') },
            { value: 'oldest', label: t('notes.sortOldest') },
          ]}
        />
      </section>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorMessage message={t('auth.errors.generic')} /> : null}

      {empty ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" aria-hidden />}
          title={noMatches ? t('notes.emptySearchTitle') : t('notes.emptyTitle')}
          description={noMatches ? t('notes.emptySearchDescription') : t('notes.emptyDescription')}
          action={
            noMatches ? undefined : (
              <Link to="/notes/new">
                <Button>{t('notes.createFirst')}</Button>
              </Link>
            )
          }
        />
      ) : null}

      {notes && notes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
