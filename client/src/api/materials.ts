import { apiClient } from '@/api/client';
import type { Material, MaterialStatus } from '@/types/material';

export type MaterialPayload = {
  title: string;
  description?: string;
  content?: string;
  question?: string | null;
  answer?: string | null;
  sourceUrl?: string | null;
  learnedAt: string;
  categoryId?: string | null;
};

export type MaterialsQuery = {
  search?: string;
  categoryId?: string;
  status?: MaterialStatus;
};

function toQuery(params: MaterialsQuery): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const materialsApi = {
  list: (params: MaterialsQuery = {}) =>
    apiClient.get<{ materials: Material[] }>(`/api/materials${toQuery(params)}`),
  getById: (id: string) => apiClient.get<{ material: Material }>(`/api/materials/${id}`),
  create: (payload: MaterialPayload) =>
    apiClient.post<{ material: Material }>('/api/materials', payload),
  update: (id: string, payload: Partial<MaterialPayload> & { status?: MaterialStatus }) =>
    apiClient.patch<{ material: Material }>(`/api/materials/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/materials/${id}`),
  archive: (id: string) => apiClient.patch<{ material: Material }>(`/api/materials/${id}/archive`),
};
