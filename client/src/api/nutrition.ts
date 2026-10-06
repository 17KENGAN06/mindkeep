import { apiClient } from '@/api/client';
import type {
  BodyActivity,
  BodySex,
  CalorieEstimate,
  Meal,
  NutritionPeriodResponse,
  NutritionSettings,
  StepsDay,
  WaterDay,
  WeightDay,
} from '@/types/nutrition';

import type { MealKind } from '@/features/nutrition/mealKinds';

export type MealMacrosPayload = {
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
};

export type CreateMealPayload = MealMacrosPayload & {
  title: string;
  calories: number;
  date: string;
  kind?: MealKind;
};

export type UpdateMealPayload = MealMacrosPayload & {
  title?: string;
  calories?: number;
};

export type CalorieEstimatePayload = {
  sex: BodySex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: BodyActivity;
  targetWeightKg: number;
};

export type FoodScanEstimate = {
  mealName: string;
  totalCalories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

export const nutritionApi = {
  getPeriod: (year: number, month: number) =>
    apiClient.get<NutritionPeriodResponse>(`/api/nutrition?year=${year}&month=${month}`),
  getSettings: () => apiClient.get<{ settings: NutritionSettings }>('/api/nutrition/settings'),
  updateSettings: (payload: Partial<NutritionSettings>) =>
    apiClient.patch<{ settings: NutritionSettings }>('/api/nutrition/settings', payload),
  estimateCalories: (payload: CalorieEstimatePayload) =>
    apiClient.post<{ estimate: CalorieEstimate }>('/api/nutrition/calorie-estimate', payload),
  scanFood: (payload: {
    note?: string;
    images?: Array<{ image: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }>;
  }) => apiClient.post<FoodScanEstimate>('/api/nutrition/scan', payload, { timeoutMs: 50_000 }),
  createMeal: (payload: CreateMealPayload) =>
    apiClient.post<{ meal: Meal }>('/api/nutrition/meals', payload),
  updateMeal: (id: string, payload: UpdateMealPayload) =>
    apiClient.patch<{ meal: Meal }>(`/api/nutrition/meals/${id}`, payload),
  removeMeal: (id: string) => apiClient.delete<{ success: boolean }>(`/api/nutrition/meals/${id}`),
  setWater: (date: string, glasses: number) =>
    apiClient.put<{ water: WaterDay }>('/api/nutrition/water', { date, glasses }),
  setSteps: (date: string, done: boolean) =>
    apiClient.put<{ steps: StepsDay }>('/api/nutrition/steps', { date, done }),
  setWeight: (date: string, kg: number) =>
    apiClient.put<{ weight: WeightDay }>('/api/nutrition/weight', { date, kg }),
};
