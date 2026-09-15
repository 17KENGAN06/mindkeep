import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../../api/notes';
import type { NotePayload, NotesQuery } from '../../types/note';

const notesKey = ['notes'] as const;

export function useNotes(params: NotesQuery = {}) {
  return useQuery({
    queryKey: [...notesKey, 'list', params],
    queryFn: async () => {
      const response = await notesApi.list(params);
      return response.notes;
    },
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: [...notesKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await notesApi.getById(id!);
      return response.note;
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotePayload) => notesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NotePayload> }) =>
      notesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKey });
    },
  });
}
