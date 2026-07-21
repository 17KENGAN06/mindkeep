import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, type CategoryPayload } from '@/api/categories';

const categoriesKey = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: async () => {
      const response = await categoriesApi.list();
      return response.categories;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesKey });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      categoriesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesKey });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesKey });
    },
  });
}
