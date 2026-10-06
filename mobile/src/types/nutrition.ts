export type BodySex = 'male' | 'female';
export type BodyActivity = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export type NutritionSettings = {
  calorieGoal: number;
  waterGoal: number;
  weightGoal: number | null;
  macrosEnabled?: boolean;
  bodySex?: BodySex | null;
  bodyAge?: number | null;
  bodyHeightCm?: number | null;
  bodyActivity?: BodyActivity | null;
};

export type CalorieEstimateNote =
  | 'targetBelowHealthy'
  | 'targetAboveHealthy'
  | 'bigChange'
  | 'floored';

export type CalorieEstimate = {
  calories: number;
  maintenance: number;
  basal: number;
  mode: 'lose' | 'gain' | 'hold';
  targetWeightKg: number;
  targetBmi: number;
  notes: CalorieEstimateNote[];
};

export type CalorieEstimatePayload = {
  sex: BodySex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: BodyActivity;
  targetWeightKg: number;
};

export type Meal = {
  id: string;
  title: string;
  calories: number;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
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
  protein?: number;
  fat?: number;
  carbs?: number;
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
  weightTrend?: WeightDay[];
  weightAvg?: number | null;
};

export type MealMacrosPayload = {
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
};

export type CreateMealPayload = MealMacrosPayload & {
  title: string;
  calories: number;
  date: string;
};

export type UpdateMealPayload = MealMacrosPayload & {
  title?: string;
  calories?: number;
};
