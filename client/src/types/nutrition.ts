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
  userId: string;
  createdAt: string;
  updatedAt: string;
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
  weightKg: number | null;
  overeating: boolean;
  waterMet: boolean;
};

export type NutritionPeriodResponse = {
  settings: NutritionSettings;
  days: NutritionDaySummary[];
  meals: Meal[];
  water: WaterDay[];
  weight?: WeightDay[];
  weightTrend?: WeightDay[];
  weightAvg?: number | null;
};
