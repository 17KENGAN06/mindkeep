import { apiClient } from '@/api/client';
import type {
  Meal,
  NutritionPeriodResponse,
  NutritionSettings,
  WaterDay,
  WeightDay,
} from '@/types/nutrition';

import type { MealKind } from '@/features/nutrition/mealKinds';

export type CreateMealPayload = {
  title: string;
  calories: number;
  date: string;
  kind?: MealKind;
};

export type UpdateMealPayload = {
  title?: string;
  calories?: number;
};

export type FoodScanEstimate = {
  mealName: string;
  totalCalories: number;
};

export const nutritionApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<NutritionPeriodResponse>(`/api/nutrition?year=${year}&month=${month}`),
  updateSettings: (payload: Partial<NutritionSettings>) =>
    apiClient.patch<{ settings: NutritionSettings }>('/api/nutrition/settings', payload),
  scanFood: (payload: { image: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }) =>
    apiClient.post<FoodScanEstimate>('/api/nutrition/scan', payload, { timeoutMs: 35_000 }),
  createMeal: (payload: CreateMealPayload) =>
    apiClient.post<{ meal: Meal }>('/api/nutrition/meals', payload),
  updateMeal: (id: string, payload: UpdateMealPayload) =>
    apiClient.patch<{ meal: Meal }>(`/api/nutrition/meals/${id}`, payload),
  removeMeal: (id: string) => apiClient.delete<{ success: boolean }>(`/api/nutrition/meals/${id}`),
  setWater: (date: string, glasses: number) =>
    apiClient.put<{ water: WaterDay }>('/api/nutrition/water', { date, glasses }),
  setWeight: (date: string, kg: number) =>
    apiClient.put<{ weight: WeightDay }>('/api/nutrition/weight', { date, kg }),
};
