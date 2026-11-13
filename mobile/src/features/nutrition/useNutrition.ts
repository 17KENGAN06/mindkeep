import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
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
const waterMutationKey = ['nutrition', 'water'] as const;

type WaterVariables = { date: string; glasses: number };

function patchWater(
  current: NutritionPeriodResponse | undefined,
  date: string,
  glasses: number,
): NutritionPeriodResponse | undefined {
  if (!current) return current;
  const exists = current.water.some((row) => row.date === date);
  return {
    ...current,
    water: exists
      ? current.water.map((row) => (row.date === date ? { ...row, glasses } : row))
      : [...current.water, { date, glasses }],
  };
}

function waterPeriodKey(date: string) {
  return [...nutritionKey, Number(date.slice(0, 4)), Number(date.slice(5, 7))];
}

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
    mutationKey: waterMutationKey,
    mutationFn: ({ date, glasses }: WaterVariables) => nutritionApi.setWater(date, glasses),
    onMutate: async ({ date, glasses }) => {
      const periodKey = waterPeriodKey(date);
      await queryClient.cancelQueries({ queryKey: periodKey, exact: true });
      const previous = queryClient.getQueryData<NutritionPeriodResponse>(periodKey);
      if (previous) queryClient.setQueryData(periodKey, patchWater(previous, date, glasses));
      return { periodKey, previous };
    },
    onSuccess: (_data, { date, glasses }) => {
      // Saved: keep it on screen even if a refetch that started earlier brought back the old count.
      queryClient.setQueryData<NutritionPeriodResponse>(waterPeriodKey(date), (current) =>
        patchWater(current, date, glasses),
      );
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

/**
 * Glasses to show for a day: the newest tap still being saved (from any screen) wins over the
 * cached period. A refetch that lands while taps are queued (opening Nutrition, adding a meal)
 * would otherwise show the old count, and the next tap would save a number built on it.
 */
export function useWaterGlasses(date: string, saved: number): number {
  const pending = useMutationState({
    filters: { mutationKey: waterMutationKey, status: 'pending' },
    select: (mutation) => mutation.state.variables as WaterVariables | undefined,
  });
  for (let index = pending.length - 1; index >= 0; index -= 1) {
    const variables = pending[index];
    if (variables?.date === date) return variables.glasses;
  }
  return saved;
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
