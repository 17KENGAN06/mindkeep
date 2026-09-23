import type { Request, Response } from 'express';
import { nutritionService } from '@/services/nutrition.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateMealInput,
  NutritionPeriodQuery,
  UpdateMealInput,
  UpdateNutritionSettingsInput,
  UpsertWaterInput,
  UpsertWeightInput,
} from '@/validations/nutrition.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class NutritionController {
  async listPeriod(req: Request, res: Response): Promise<void> {
    const data = await nutritionService.listPeriod(
      requireUserId(req),
      req.query as unknown as NutritionPeriodQuery,
    );
    res.status(200).json(data);
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const settings = await nutritionService.updateSettings(
      requireUserId(req),
      req.body as UpdateNutritionSettingsInput,
    );
    res.status(200).json({ settings });
  }

  async createMeal(req: Request, res: Response): Promise<void> {
    const meal = await nutritionService.createMeal(
      requireUserId(req),
      req.body as CreateMealInput,
    );
    res.status(201).json({ meal });
  }

  async updateMeal(req: Request, res: Response): Promise<void> {
    const meal = await nutritionService.updateMeal(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateMealInput,
    );
    res.status(200).json({ meal });
  }

  async removeMeal(req: Request, res: Response): Promise<void> {
    const result = await nutritionService.removeMeal(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async upsertWater(req: Request, res: Response): Promise<void> {
    const water = await nutritionService.upsertWater(
      requireUserId(req),
      req.body as UpsertWaterInput,
    );
    res.status(200).json({ water });
  }

  async upsertWeight(req: Request, res: Response): Promise<void> {
    const weight = await nutritionService.upsertWeight(
      requireUserId(req),
      req.body as UpsertWeightInput,
    );
    res.status(200).json({ weight });
  }
}

export const nutritionController = new NutritionController();
