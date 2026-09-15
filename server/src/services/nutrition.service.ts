import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type {
  CreateMealInput,
  NutritionPeriodQuery,
  UpdateMealInput,
  UpdateNutritionSettingsInput,
  UpsertWaterInput,
} from '@/validations/nutrition.schemas.js';
import { AppError } from '@/utils/AppError.js';

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
  date: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return { ...meal, date: toDateKey(meal.date) };
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

  async updateSettings(userId: string, input: UpdateNutritionSettingsInput) {
    await this.getSettings(userId);
    return prisma.nutritionSettings.update({
      where: { userId },
      data: {
        ...(input.calorieGoal !== undefined ? { calorieGoal: input.calorieGoal } : {}),
        ...(input.waterGoal !== undefined ? { waterGoal: input.waterGoal } : {}),
      },
    });
  }

  async listPeriod(userId: string, query: NutritionPeriodQuery) {
    const settings = await this.getSettings(userId);
    const { from, to } = periodRange(query);

    const [meals, waterDays] = await Promise.all([
      prisma.meal.findMany({
        where: { userId, date: { gte: from, lt: to } },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.waterDay.findMany({
        where: { userId, date: { gte: from, lt: to } },
      }),
    ]);

    const waterByDate = new Map(waterDays.map((row) => [toDateKey(row.date), row.glasses]));
    const caloriesByDate = new Map<string, { calories: number; mealCount: number }>();

    for (const meal of meals) {
      const key = toDateKey(meal.date);
      const bucket = caloriesByDate.get(key) ?? { calories: 0, mealCount: 0 };
      bucket.calories += meal.calories;
      bucket.mealCount += 1;
      caloriesByDate.set(key, bucket);
    }

    const dayKeys = new Set([...caloriesByDate.keys(), ...waterByDate.keys()]);
    const days = [...dayKeys]
      .sort((a, b) => a.localeCompare(b))
      .map((date) => {
        const eaten = caloriesByDate.get(date)?.calories ?? 0;
        const mealCount = caloriesByDate.get(date)?.mealCount ?? 0;
        const waterGlasses = waterByDate.get(date) ?? 0;
        return {
          date,
          calories: eaten,
          mealCount,
          waterGlasses,
          overeating: eaten > settings.calorieGoal,
          waterMet: waterGlasses >= settings.waterGoal,
        };
      });

    return {
      settings: {
        calorieGoal: settings.calorieGoal,
        waterGoal: settings.waterGoal,
      },
      days,
      meals: meals.map(serializeMeal),
      water: waterDays.map((row) => ({
        date: toDateKey(row.date),
        glasses: row.glasses,
      })),
    };
  }

  async createMeal(userId: string, input: CreateMealInput) {
    return serializeMeal(
      await prisma.meal.create({
        data: {
          title: input.title,
          calories: input.calories,
          date: parseDateOnly(input.date),
          userId,
        },
      }),
    );
  }

  async updateMeal(userId: string, id: string, input: UpdateMealInput) {
    const existing = await prisma.meal.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Meal not found', { statusCode: 404, code: 'MEAL_NOT_FOUND' });
    }

    return serializeMeal(
      await prisma.meal.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.calories !== undefined ? { calories: input.calories } : {}),
        },
      }),
    );
  }

  async removeMeal(userId: string, id: string) {
    const existing = await prisma.meal.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new AppError('Meal not found', { statusCode: 404, code: 'MEAL_NOT_FOUND' });
    }
    await prisma.meal.delete({ where: { id } });
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
}

export const nutritionService = new NutritionService();
