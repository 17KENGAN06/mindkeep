import { apiClient } from '@/api/client';
import type { Meal, NutritionPeriodResponse, NutritionSettings, WaterDay } from '@/types/nutrition';

export type CreateMealPayload = {
  title: string;
  calories: number;
  date: string;
};

export type UpdateMealPayload = {
  title?: string;
  calories?: number;
};

export const nutritionApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<NutritionPeriodResponse>(`/api/nutrition?year=${year}&month=${month}`),
  updateSettings: (payload: Partial<NutritionSettings>) =>
    apiClient.patch<{ settings: NutritionSettings }>('/api/nutrition/settings', payload),
  createMeal: (payload: CreateMealPayload) =>
    apiClient.post<{ meal: Meal }>('/api/nutrition/meals', payload),
  updateMeal: (id: string, payload: UpdateMealPayload) =>
    apiClient.patch<{ meal: Meal }>(`/api/nutrition/meals/${id}`, payload),
  removeMeal: (id: string) => apiClient.delete<{ success: boolean }>(`/api/nutrition/meals/${id}`),
  setWater: (date: string, glasses: number) =>
    apiClient.put<{ water: WaterDay }>('/api/nutrition/water', { date, glasses }),
};
