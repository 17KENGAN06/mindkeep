import { apiClient } from '@/api/client';
import type { Category } from '@/types/category';

export type CategoryPayload = {
  name: string;
};

export const categoriesApi = {
  list: () => apiClient.get<{ categories: Category[] }>('/api/categories'),
  create: (payload: CategoryPayload) =>
    apiClient.post<{ category: Category }>('/api/categories', payload),
  update: (id: string, payload: CategoryPayload) =>
    apiClient.patch<{ category: Category }>(`/api/categories/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/api/categories/${id}`),
};
