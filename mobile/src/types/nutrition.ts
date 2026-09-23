export type NutritionSettings = {
  calorieGoal: number;
  waterGoal: number;
  weightGoal: number | null;
};

export type Meal = {
  id: string;
  title: string;
  calories: number;
  date: string;
};

export type WaterDay = {
  date: string;
  glasses: number;
};

export type WeightDay = {
  date: string;
  kg: number;
};

export type NutritionDaySummary = {
  date: string;
  calories: number;
  mealCount: number;
  waterGlasses: number;
  weightKg?: number | null;
  overeating: boolean;
  waterMet: boolean;
};

export type NutritionPeriodResponse = {
  settings: NutritionSettings;
  days?: NutritionDaySummary[];
  meals: Meal[];
  water: WaterDay[];
  weight?: WeightDay[];
  weightAvg?: number | null;
};

export type CreateMealPayload = {
  title: string;
  calories: number;
  date: string;
};

export type UpdateMealPayload = {
  title?: string;
  calories?: number;
};
