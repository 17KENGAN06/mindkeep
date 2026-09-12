import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi, type NotePayload, type NotesQuery } from '@/api/notes';

export function useNotes(params: NotesQuery = {}) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const response = await notesApi.list(params);
      return response.notes;
    },
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: ['notes', id],
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
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NotePayload> }) =>
      notesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['notes', variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
