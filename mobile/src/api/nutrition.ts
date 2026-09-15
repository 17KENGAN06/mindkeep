import { apiClient } from './client';
import type {
  CreateMealPayload,
  Meal,
  NutritionPeriodResponse,
  NutritionSettings,
  WaterDay,
} from '../types/nutrition';

export const nutritionApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<NutritionPeriodResponse>(`/api/nutrition?year=${year}&month=${month}`),
  updateSettings: (payload: Partial<NutritionSettings>) =>
    apiClient.patch<{ settings: NutritionSettings }>('/api/nutrition/settings', payload),
  createMeal: (payload: CreateMealPayload) =>
    apiClient.post<{ meal: Meal }>('/api/nutrition/meals', payload),
  removeMeal: (id: string) => apiClient.delete<{ success: boolean }>(`/api/nutrition/meals/${id}`),
  setWater: (date: string, glasses: number) =>
    apiClient.put<{ water: WaterDay }>('/api/nutrition/water', { date, glasses }),
};
