import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type {
  CreateMealInput,
  EstimateCaloriesInput,
  NutritionPeriodQuery,
  UpdateMealInput,
  UpdateNutritionSettingsInput,
  UpsertWaterInput,
  UpsertWeightInput,
  UpsertStepsInput,
} from '@/validations/nutrition.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { requireDeleted, requireOwned } from '@/utils/owned.js';
import { assertMealDateAllowed, getEntitlement, mealHistoryFrom, weightHistoryFrom } from '@/services/entitlements.service.js';
import {
  addMacros,
  emptyMacroTotals,
  roundMacro,
  roundMacroTotals,
  type MacroTotals,
} from '@/services/nutrition-macros.js';
import {
  estimateCalorieTarget,
  parseBodyActivity,
  parseBodySex,
  type CalorieEstimate,
} from '@/services/nutrition-profile.js';

function rethrowNutritionError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
    throw new AppError('Nutrition tables are missing. Run database migrations.', {
      statusCode: 503,
      code: 'NUTRITION_UNAVAILABLE',
    });
  }
  throw error;
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundKg(value: number): number {
  return Math.round(value * 10) / 10;
}

function serializeSettings(settings: {
  calorieGoal: number;
  waterGoal: number;
  stepsGoal: number;
  weightGoal: number | null;
  macrosEnabled: boolean;
  bodySex: string | null;
  bodyAge: number | null;
  bodyHeightCm: number | null;
  bodyActivity: string | null;
}) {
  return {
    calorieGoal: settings.calorieGoal,
    waterGoal: settings.waterGoal,
    stepsGoal: settings.stepsGoal,
    weightGoal: settings.weightGoal === null ? null : roundKg(settings.weightGoal),
    macrosEnabled: settings.macrosEnabled,
    bodySex: parseBodySex(settings.bodySex),
    bodyAge: settings.bodyAge,
    bodyHeightCm: settings.bodyHeightCm,
    bodyActivity: parseBodyActivity(settings.bodyActivity),
  };
}

function periodRange(query: NutritionPeriodQuery): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(query.year, query.month - 1, 1, 0, 0, 0)),
    to: new Date(Date.UTC(query.year, query.month, 1, 0, 0, 0)),
  };
}

function serializeMeal(meal: {
  id: string;
  title: string;
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  date: Date;
  kind: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'extra' | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...meal,
    date: toDateKey(meal.date),
    protein: roundMacro(meal.protein),
    fat: roundMacro(meal.fat),
    carbs: roundMacro(meal.carbs),
  };
}

export class NutritionService {
  async getSettings(userId: string) {
    try {
      return await prisma.nutritionSettings.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    } catch (error) {
      rethrowNutritionError(error);
    }
  }

  async readSettings(userId: string) {
    return serializeSettings(await this.getSettings(userId));
  }

  async updateSettings(userId: string, input: UpdateNutritionSettingsInput) {
    await this.getSettings(userId);
    const settings = await prisma.nutritionSettings.update({
      where: { userId },
      data: {
        ...(input.calorieGoal !== undefined ? { calorieGoal: input.calorieGoal } : {}),
        ...(input.waterGoal !== undefined ? { waterGoal: input.waterGoal } : {}),
        ...(input.stepsGoal !== undefined ? { stepsGoal: input.stepsGoal } : {}),
        ...(input.weightGoal !== undefined
          ? { weightGoal: input.weightGoal === null ? null : roundKg(input.weightGoal) }
          : {}),
        ...(input.macrosEnabled !== undefined ? { macrosEnabled: input.macrosEnabled } : {}),
        ...(input.bodySex !== undefined ? { bodySex: input.bodySex } : {}),
        ...(input.bodyAge !== undefined ? { bodyAge: input.bodyAge } : {}),
        ...(input.bodyHeightCm !== undefined ? { bodyHeightCm: input.bodyHeightCm } : {}),
        ...(input.bodyActivity !== undefined ? { bodyActivity: input.bodyActivity } : {}),
      },
    });
    return serializeSettings(settings);
  }

  /** Suggests a daily goal and remembers the body profile so the helper stays prefilled. */
  async estimateCalories(userId: string, input: EstimateCaloriesInput): Promise<CalorieEstimate> {
    await this.getSettings(userId);
    await prisma.nutritionSettings.update({
      where: { userId },
      data: {
        bodySex: input.sex,
        bodyAge: input.age,
        bodyHeightCm: input.heightCm,
        bodyActivity: input.activity,
      },
    });
    return estimateCalorieTarget(input);
  }

  async listPeriod(userId: string, query: NutritionPeriodQuery) {
    const settings = await this.getSettings(userId);
    const { from, to } = periodRange(query);
    const mealFrom = await mealHistoryFrom(userId, from);
    const trendFromRequested = new Date(Date.UTC(query.year, query.month - 12, 1, 0, 0, 0));
    const trendFrom = await weightHistoryFrom(userId, trendFromRequested);
    const weightFrom = await weightHistoryFrom(userId, from);

    const [meals, waterDays, weightDays, weightTrendDays, stepsDays] = await Promise.all([
      prisma.meal.findMany({
        where: { userId, date: { gte: mealFrom, lt: to } },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.waterDay.findMany({
        where: { userId, date: { gte: from, lt: to } },
      }),
      prisma.weightDay.findMany({
        where: { userId, date: { gte: weightFrom, lt: to } },
      }),
      prisma.weightDay.findMany({
        where: { userId, date: { gte: trendFrom, lt: to } },
        orderBy: { date: 'asc' },
      }),
      prisma.stepsDay.findMany({
        where: { userId, date: { gte: from, lt: to } },
      }),
    ]);

    const waterByDate = new Map(waterDays.map((row) => [toDateKey(row.date), row.glasses]));
    const weightByDate = new Map(weightDays.map((row) => [toDateKey(row.date), roundKg(row.kg)]));
    const caloriesByDate = new Map<
      string,
      { calories: number; mealCount: number; macros: MacroTotals }
    >();

    for (const meal of meals) {
      const key = toDateKey(meal.date);
      const bucket =
        caloriesByDate.get(key) ?? { calories: 0, mealCount: 0, macros: emptyMacroTotals() };
      bucket.calories += meal.calories;
      bucket.mealCount += 1;
      bucket.macros = addMacros(bucket.macros, meal);
      caloriesByDate.set(key, bucket);
    }

    const dayKeys = new Set([...caloriesByDate.keys(), ...waterByDate.keys(), ...weightByDate.keys()]);
    const days = [...dayKeys]
      .sort((a, b) => a.localeCompare(b))
      .map((date) => {
        const bucket = caloriesByDate.get(date);
        const eaten = bucket?.calories ?? 0;
        const mealCount = bucket?.mealCount ?? 0;
        const macros = roundMacroTotals(bucket?.macros ?? emptyMacroTotals());
        const waterGlasses = waterByDate.get(date) ?? 0;
        const weightKg = weightByDate.get(date) ?? null;
        return {
          date,
          calories: eaten,
          mealCount,
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs,
          waterGlasses,
          weightKg,
          overeating: eaten > settings.calorieGoal,
          waterMet: waterGlasses >= settings.waterGoal,
        };
      });

    const weightAvg =
      weightDays.length === 0
        ? null
        : roundKg(weightDays.reduce((sum, row) => sum + row.kg, 0) / weightDays.length);

    return {
      settings: serializeSettings(settings),
      days,
      meals: meals.map(serializeMeal),
      water: waterDays.map((row) => ({
        date: toDateKey(row.date),
        glasses: row.glasses,
      })),
      steps: stepsDays.map((row) => ({
        date: toDateKey(row.date),
        done: row.done,
      })),
      weight: weightDays.map((row) => ({
        date: toDateKey(row.date),
        kg: roundKg(row.kg),
      })),
      weightTrend: weightTrendDays.map((row) => ({
        date: toDateKey(row.date),
        kg: roundKg(row.kg),
      })),
      weightAvg,
    };
  }

  async createMeal(userId: string, input: CreateMealInput) {
    await assertMealDateAllowed(userId, input.date);
    let kind = input.kind ?? null;
    if (kind) {
      const entitlement = await getEntitlement(userId);
      if (!entitlement.pro) kind = null;
    }
    return serializeMeal(
      await prisma.meal.create({
        data: {
          title: input.title,
          calories: input.calories,
          protein: roundMacro(input.protein),
          fat: roundMacro(input.fat),
          carbs: roundMacro(input.carbs),
          date: parseDateOnly(input.date),
          kind,
          userId,
        },
      }),
    );
  }

  async updateMeal(userId: string, id: string, input: UpdateMealInput) {
    requireOwned(
      await prisma.meal.findFirst({ where: { id, userId } }),
      'Meal not found',
      'MEAL_NOT_FOUND',
    );

    let kind = input.kind;
    if (kind) {
      const entitlement = await getEntitlement(userId);
      if (!entitlement.pro) kind = undefined;
    }

    return serializeMeal(
      await prisma.meal.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.calories !== undefined ? { calories: input.calories } : {}),
          ...(kind !== undefined ? { kind } : {}),
          ...(input.protein !== undefined ? { protein: roundMacro(input.protein) } : {}),
          ...(input.fat !== undefined ? { fat: roundMacro(input.fat) } : {}),
          ...(input.carbs !== undefined ? { carbs: roundMacro(input.carbs) } : {}),
        },
      }),
    );
  }

  async removeMeal(userId: string, id: string) {
    const result = await prisma.meal.deleteMany({ where: { id, userId } });
    requireDeleted(result.count, 'Meal not found', 'MEAL_NOT_FOUND');
    return { success: true };
  }

  async upsertWater(userId: string, input: UpsertWaterInput) {
    const date = parseDateOnly(input.date);
    const row = await prisma.waterDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, glasses: input.glasses },
      update: { glasses: input.glasses },
    });
    return { date: toDateKey(row.date), glasses: row.glasses };
  }

  async upsertSteps(userId: string, input: UpsertStepsInput) {
    const date = parseDateOnly(input.date);
    const row = await prisma.stepsDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, done: input.done },
      update: { done: input.done },
    });
    return { date: toDateKey(row.date), done: row.done };
  }

  async upsertWeight(userId: string, input: UpsertWeightInput) {
    const date = parseDateOnly(input.date);
    const kg = roundKg(input.kg);
    const row = await prisma.weightDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, kg },
      update: { kg },
    });
    return { date: toDateKey(row.date), kg: roundKg(row.kg) };
  }
}

export const nutritionService = new NutritionService();
