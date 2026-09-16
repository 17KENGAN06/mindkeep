import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../../api/materials';
import type { MaterialPayload, MaterialStatus, MaterialsQuery } from '../../types/material';

export function useMaterials(params: MaterialsQuery = {}) {
  return useQuery({
    queryKey: ['materials', 'list', params],
    queryFn: async () => {
      const response = await materialsApi.list(params);
      return response.materials;
    },
  });
}

export function useMaterial(id: string | undefined) {
  return useQuery({
    queryKey: ['materials', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await materialsApi.getById(id!);
      return response.material;
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaterialPayload) => materialsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MaterialPayload> & { status?: MaterialStatus };
    }) => materialsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      void queryClient.invalidateQueries({ queryKey: ['materials', variables.id] });
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useArchiveMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialsApi.archive(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      void queryClient.invalidateQueries({ queryKey: ['materials', id] });
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      void queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
