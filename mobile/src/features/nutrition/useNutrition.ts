import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '../../api/nutrition';
import type { CreateMealPayload, NutritionSettings, UpdateMealPayload } from '../../types/nutrition';

const nutritionKey = ['nutrition'] as const;

function invalidateNutrition(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: nutritionKey });
}

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
      void invalidateNutrition(queryClient);
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMealPayload) => nutritionApi.createMeal(payload),
    onSuccess: () => {
      void invalidateNutrition(queryClient);
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMealPayload }) =>
      nutritionApi.updateMeal(id, payload),
    onSuccess: () => {
      void invalidateNutrition(queryClient);
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.removeMeal(id),
    onSuccess: () => {
      void invalidateNutrition(queryClient);
    },
  });
}

export function useSetWater(_year?: number, _month?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, glasses }: { date: string; glasses: number }) =>
      nutritionApi.setWater(date, glasses),
    onSuccess: () => {
      void invalidateNutrition(queryClient);
    },
  });
}

export function useSetWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, kg }: { date: string; kg: number }) => nutritionApi.setWeight(date, kg),
    onSuccess: () => {
      void invalidateNutrition(queryClient);
    },
  });
}
