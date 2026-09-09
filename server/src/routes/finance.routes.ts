import { Router } from 'express';
import { financeController } from '@/controllers/finance.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createFinanceCategorySchema,
  createFinanceOperationSchema,
  financeIdParamsSchema,
  financePeriodQuerySchema,
  updateFinanceCategorySchema,
  updateFinanceSettingsSchema,
} from '@/validations/finance.schemas.js';

export const financeRouter = Router();

financeRouter.use(requireAuth);

financeRouter.get(
  '/settings',
  asyncHandler((req, res) => financeController.getSettings(req, res)),
);

financeRouter.patch(
  '/settings',
  validate(updateFinanceSettingsSchema),
  asyncHandler((req, res) => financeController.updateSettings(req, res)),
);

financeRouter.get(
  '/rates',
  asyncHandler((req, res) => financeController.getRates(req, res)),
);

financeRouter.get(
  '/summary',
  validate(financePeriodQuerySchema, 'query'),
  asyncHandler((req, res) => financeController.getSummary(req, res)),
);

financeRouter.get(
  '/categories',
  asyncHandler((req, res) => financeController.listCategories(req, res)),
);

financeRouter.post(
  '/categories',
  validate(createFinanceCategorySchema),
  asyncHandler((req, res) => financeController.createCategory(req, res)),
);

financeRouter.patch(
  '/categories/:id',
  validate(financeIdParamsSchema, 'params'),
  validate(updateFinanceCategorySchema),
  asyncHandler((req, res) => financeController.updateCategory(req, res)),
);

financeRouter.delete(
  '/categories/:id',
  validate(financeIdParamsSchema, 'params'),
  asyncHandler((req, res) => financeController.removeCategory(req, res)),
);

financeRouter.get(
  '/operations',
  validate(financePeriodQuerySchema, 'query'),
  asyncHandler((req, res) => financeController.listOperations(req, res)),
);

financeRouter.post(
  '/operations',
  validate(createFinanceOperationSchema),
  asyncHandler((req, res) => financeController.createOperation(req, res)),
);

financeRouter.delete(
  '/operations/:id',
  validate(financeIdParamsSchema, 'params'),
  asyncHandler((req, res) => financeController.removeOperation(req, res)),
);
