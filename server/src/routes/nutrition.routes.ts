import { Router } from 'express';
import { nutritionController } from '@/controllers/nutrition.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { foodScanRateLimit } from '@/middleware/foodScanRateLimit.js';
import { validate } from '@/middleware/validate.js';
import {
  createMealSchema,
  estimateCaloriesSchema,
  mealIdParamsSchema,
  nutritionPeriodQuerySchema,
  scanFoodSchema,
  updateMealSchema,
  updateNutritionSettingsSchema,
  upsertStepsSchema,
  upsertWaterSchema,
  upsertWeightSchema,
} from '@/validations/nutrition.schemas.js';

export const nutritionRouter = Router();

nutritionRouter.use(requireAuth);

nutritionRouter.get(
  '/',
  validate(nutritionPeriodQuerySchema, 'query'),
  asyncHandler((req, res) => nutritionController.listPeriod(req, res)),
);

nutritionRouter.get(
  '/settings',
  asyncHandler((req, res) => nutritionController.getSettings(req, res)),
);

nutritionRouter.patch(
  '/settings',
  validate(updateNutritionSettingsSchema),
  asyncHandler((req, res) => nutritionController.updateSettings(req, res)),
);

nutritionRouter.post(
  '/calorie-estimate',
  validate(estimateCaloriesSchema),
  asyncHandler((req, res) => nutritionController.estimateCalories(req, res)),
);

nutritionRouter.put(
  '/water',
  validate(upsertWaterSchema),
  asyncHandler((req, res) => nutritionController.upsertWater(req, res)),
);

nutritionRouter.put(
  '/steps',
  validate(upsertStepsSchema),
  asyncHandler((req, res) => nutritionController.upsertSteps(req, res)),
);

nutritionRouter.put(
  '/weight',
  validate(upsertWeightSchema),
  asyncHandler((req, res) => nutritionController.upsertWeight(req, res)),
);

nutritionRouter.post(
  '/scan',
  foodScanRateLimit,
  validate(scanFoodSchema),
  asyncHandler((req, res) => nutritionController.scanFood(req, res)),
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
