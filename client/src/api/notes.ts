import { apiClient } from '@/api/client';
import type { Note } from '@/types/note';

export type NotePayload = {
  title: string;
  content: string;
  sourceUrl?: string | null;
};

export type NotesQuery = {
  search?: string;
  sort?: 'newest' | 'oldest';
};

function toQuery(params: NotesQuery): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const notesApi = {
  list: (params: NotesQuery = {}) =>
    apiClient.get<{ notes: Note[] }>(`/api/notes${toQuery(params)}`),
  getById: (id: string) => apiClient.get<{ note: Note }>(`/api/notes/${id}`),
  create: (payload: NotePayload) => apiClient.post<{ note: Note }>('/api/notes', payload),
  update: (id: string, payload: Partial<NotePayload>) =>
    apiClient.patch<{ note: Note }>(`/api/notes/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/notes/${id}`),
};
