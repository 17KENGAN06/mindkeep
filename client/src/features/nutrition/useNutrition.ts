import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  nutritionApi,
  type CreateMealPayload,
  type UpdateMealPayload,
} from '@/api/nutrition';
import type { NutritionSettings } from '@/types/nutrition';

const nutritionKey = ['nutrition'] as const;

export function useNutritionPeriod(year: number, month: number) {
  return useQuery({
    queryKey: [...nutritionKey, year, month],
    queryFn: () => nutritionApi.getPeriod(year, month),
  });
}

export function useUpdateNutritionSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NutritionSettings>) => nutritionApi.updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKey });
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMealPayload) => nutritionApi.createMeal(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKey });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMealPayload }) =>
      nutritionApi.updateMeal(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKey });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.removeMeal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKey });
    },
  });
}

export function useSetWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, glasses }: { date: string; glasses: number }) =>
      nutritionApi.setWater(date, glasses),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nutritionKey });
    },
  });
}
