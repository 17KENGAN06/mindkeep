import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Quote } from 'lucide-react';
import { NoteCard } from '@/components/notes/NoteCard';
import { SnippetComposer } from '@/components/notes/SnippetComposer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { PlanRemain } from '@/components/billing/PlanRemain';
import { mutationErrorMessage } from '@/features/billing/planLimit';
import { useCreateNote, useNotes } from '@/features/notes/useNotes';
import type { NotesQuery } from '@/api/notes';

const KIND_FILTERS = ['all', 'page', 'snippet'] as const;

type KindFilter = (typeof KIND_FILTERS)[number];

export function NotesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<NonNullable<NotesQuery['sort']>>('newest');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerError, setComposerError] = useState<string | undefined>();
  const createNote = useCreateNote();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      sort,
      kind: kindFilter === 'all' ? undefined : kindFilter,
    }),
    [search, sort, kindFilter],
  );

  const { data: notes, isLoading, isError } = useNotes(query);
  const empty = !isLoading && !isError && notes && notes.length === 0;
  const noMatches = empty && Boolean(query.search);
  const emptyByFilter = empty && !noMatches && kindFilter !== 'all';

  const openComposer = () => {
    setComposerError(undefined);
    setComposerOpen(true);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notes.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('notes.subtitle')}</p>
          <PlanRemain feature="notes" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Link to="/notes/new" className="sm:shrink-0">
            <Button className="w-full sm:w-auto">{t('notes.createPage')}</Button>
          </Link>
          <Button
            variant="secondary"
            type="button"
            className="w-full sm:w-auto"
            onClick={openComposer}
          >
            {t('notes.createSnippet')}
          </Button>
        </div>
      </section>

      {composerOpen ? (
        <section className="rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:p-5">
          <SnippetComposer
            key="new-snippet"
            autoFocus
            submitLabel={t('notes.snippetSave')}
            cancelLabel={t('common.cancel')}
            isSubmitting={createNote.isPending}
            errorMessage={composerError}
            onCancel={() => {
              setComposerOpen(false);
              setComposerError(undefined);
            }}
            onSubmit={async (content) => {
              if (createNote.isPending) return;
              setComposerError(undefined);
              try {
                await createNote.mutateAsync({
                  kind: 'snippet',
                  title: '',
                  content,
                  sourceUrl: null,
                });
                setComposerOpen(false);
              } catch (error) {
                setComposerError(mutationErrorMessage(error, t));
              }
            }}
          />
        </section>
      ) : null}

      <section className="space-y-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
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
        </div>
        <div className="flex flex-wrap gap-2">
          {KIND_FILTERS.map((kind) => {
            const selected = kindFilter === kind;
            return (
              <button
                key={kind}
                type="button"
                className={`min-h-10 whitespace-nowrap rounded-full px-3 text-sm font-medium transition touch-manipulation ${
                  selected
                    ? 'bg-brand-500 text-[#07110d]'
                    : 'bg-surface text-ink ring-1 ring-line hover:ring-brand-400'
                }`}
                onClick={() => setKindFilter(kind)}
              >
                {t(`notes.kind.${kind}`)}
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorMessage message={t('auth.errors.generic')} /> : null}

      {empty ? (
        <EmptyState
          icon={
            kindFilter === 'snippet' ? (
              <Quote className="h-7 w-7" aria-hidden />
            ) : (
              <FileText className="h-7 w-7" aria-hidden />
            )
          }
          title={
            noMatches
              ? t('notes.emptySearchTitle')
              : kindFilter === 'snippet'
                ? t('notes.emptySnippetTitle')
                : kindFilter === 'page'
                  ? t('notes.emptyPageTitle')
                  : t('notes.emptyTitle')
          }
          description={
            noMatches
              ? t('notes.emptySearchDescription')
              : kindFilter === 'snippet'
                ? t('notes.emptySnippetDescription')
                : kindFilter === 'page'
                  ? t('notes.emptyPageDescription')
                  : t('notes.emptyDescription')
          }
          action={
            noMatches ? undefined : emptyByFilter && kindFilter === 'snippet' ? (
              <Button type="button" onClick={openComposer}>
                {t('notes.createSnippet')}
              </Button>
            ) : emptyByFilter && kindFilter === 'page' ? (
              <Link to="/notes/new">
                <Button>{t('notes.createPage')}</Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/notes/new">
                  <Button>{t('notes.createPage')}</Button>
                </Link>
                <Button type="button" variant="secondary" onClick={openComposer}>
                  {t('notes.createSnippet')}
                </Button>
              </div>
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
