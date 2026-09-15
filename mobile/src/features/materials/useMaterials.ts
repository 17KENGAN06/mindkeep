import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '../../api/materials';
import type { MaterialPayload, MaterialsQuery } from '../../types/material';

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
