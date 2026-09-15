export type Note = {
  id: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotePayload = {
  title: string;
  content: string;
  sourceUrl?: string | null;
};

export type NotesQuery = {
  search?: string;
  sort?: 'newest' | 'oldest';
};
