import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '../../api/nutrition';
import { touchPlanUsage } from '../billing/planLimit';
import type {
  CalorieEstimatePayload,
  CreateMealPayload,
  NutritionPeriodResponse,
  NutritionSettings,
  UpdateMealPayload,
} from '../../types/nutrition';

const nutritionKey = ['nutrition'] as const;

function invalidateNutrition(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: nutritionKey });
}

export function useNutritionPeriod(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: [...nutritionKey, year, month],
    queryFn: () => nutritionApi.getPeriod(year, month),
    enabled,
  });
}

export function useNutritionSettings(enabled = true) {
  return useQuery({
    queryKey: [...nutritionKey, 'settings'],
    queryFn: () => nutritionApi.getSettings(),
    enabled,
  });
}

export function useEstimateCalories() {
  return useMutation({
    mutationFn: (payload: CalorieEstimatePayload) => nutritionApi.estimateCalories(payload),
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
      touchPlanUsage(queryClient);
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

/**
 * Water is tapped quickly, several times in a row: the count updates on screen at once
 * (optimistic), taps are sent one after another in order, and a failed one rolls back.
 */
export function useSetWater(_year?: number, _month?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: 'nutrition-water' },
    mutationFn: ({ date, glasses }: { date: string; glasses: number }) =>
      nutritionApi.setWater(date, glasses),
    onMutate: async ({ date, glasses }) => {
      const year = Number(date.slice(0, 4));
      const month = Number(date.slice(5, 7));
      const periodKey = [...nutritionKey, year, month];
      await queryClient.cancelQueries({ queryKey: periodKey, exact: true });
      const previous = queryClient.getQueryData<NutritionPeriodResponse>(periodKey);
      if (previous) {
        const exists = previous.water.some((row) => row.date === date);
        queryClient.setQueryData<NutritionPeriodResponse>(periodKey, {
          ...previous,
          water: exists
            ? previous.water.map((row) => (row.date === date ? { ...row, glasses } : row))
            : [...previous.water, { date, glasses }],
        });
      }
      return { periodKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.periodKey, context.previous);
    },
    onSettled: () => {
      // Only after the last queued tap, so a refetch never overwrites newer taps on screen.
      if (
        queryClient.isMutating({ predicate: (m) => m.options.scope?.id === 'nutrition-water' }) <= 1
      ) {
        void invalidateNutrition(queryClient);
      }
    },
  });
}

export function useSetSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, done }: { date: string; done: boolean }) =>
      nutritionApi.setSteps(date, done),
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
      touchPlanUsage(queryClient);
    },
  });
}
