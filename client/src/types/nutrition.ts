export type NutritionSettings = {
  calorieGoal: number;
  waterGoal: number;
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

export type NutritionDaySummary = {
  date: string;
  calories: number;
  mealCount: number;
  waterGlasses: number;
  overeating: boolean;
  waterMet: boolean;
};

export type NutritionPeriodResponse = {
  settings: NutritionSettings;
  days: NutritionDaySummary[];
  meals: Meal[];
  water: WaterDay[];
};
