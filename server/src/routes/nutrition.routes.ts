import { Router } from 'express';
import { nutritionController } from '@/controllers/nutrition.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createMealSchema,
  mealIdParamsSchema,
  nutritionPeriodQuerySchema,
  updateMealSchema,
  updateNutritionSettingsSchema,
  upsertWaterSchema,
} from '@/validations/nutrition.schemas.js';

export const nutritionRouter = Router();

nutritionRouter.use(requireAuth);

nutritionRouter.get(
  '/',
  validate(nutritionPeriodQuerySchema, 'query'),
  asyncHandler((req, res) => nutritionController.listPeriod(req, res)),
);

nutritionRouter.patch(
  '/settings',
  validate(updateNutritionSettingsSchema),
  asyncHandler((req, res) => nutritionController.updateSettings(req, res)),
);

nutritionRouter.put(
  '/water',
  validate(upsertWaterSchema),
  asyncHandler((req, res) => nutritionController.upsertWater(req, res)),
);

nutritionRouter.post(
  '/meals',
  validate(createMealSchema),
  asyncHandler((req, res) => nutritionController.createMeal(req, res)),
);

nutritionRouter.patch(
  '/meals/:id',
  validate(mealIdParamsSchema, 'params'),
  validate(updateMealSchema),
  asyncHandler((req, res) => nutritionController.updateMeal(req, res)),
);

nutritionRouter.delete(
  '/meals/:id',
  validate(mealIdParamsSchema, 'params'),
  asyncHandler((req, res) => nutritionController.removeMeal(req, res)),
);
