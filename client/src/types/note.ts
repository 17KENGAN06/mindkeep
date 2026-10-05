export type Note = {
  id: string;
  kind?: 'page' | 'snippet';
  title: string;
  content: string;
  sourceUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export function isSnippetNote(note: Pick<Note, 'kind'>): boolean {
  return note.kind === 'snippet';
}
