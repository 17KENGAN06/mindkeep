import { Router } from 'express';
import { budgetController } from '@/controllers/budget.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  budgetOperationIdParamsSchema,
  createBudgetCategorySchema,
  createBudgetOperationSchema,
  createMandatoryPaymentSchema,
  createPlannedExpenseSchema,
  mandatoryPaymentIdParamsSchema,
  monthQuerySchema,
  toggleMandatoryPaidSchema,
  updateBudgetOperationSchema,
  updateBudgetSettingsSchema,
  updateMandatoryPaymentSchema,
  yearQuerySchema,
} from '@/validations/budget.schemas.js';

export const budgetRouter = Router();

budgetRouter.use(requireAuth);

budgetRouter.get('/settings', asyncHandler((req, res) => budgetController.getSettings(req, res)));
budgetRouter.patch(
  '/settings',
  validate(updateBudgetSettingsSchema),
  asyncHandler((req, res) => budgetController.updateSettings(req, res)),
);

budgetRouter.get('/categories', asyncHandler((req, res) => budgetController.listCategories(req, res)));
budgetRouter.post(
  '/categories',
  validate(createBudgetCategorySchema),
  asyncHandler((req, res) => budgetController.createCategory(req, res)),
);
budgetRouter.delete(
  '/categories/:id',
  validate(budgetOperationIdParamsSchema, 'params'),
  asyncHandler((req, res) => budgetController.removeCategory(req, res)),
);

budgetRouter.get(
  '/month',
  validate(monthQuerySchema, 'query'),
  asyncHandler((req, res) => budgetController.month(req, res)),
);
budgetRouter.get(
  '/year',
  validate(yearQuerySchema, 'query'),
  asyncHandler((req, res) => budgetController.year(req, res)),
);

budgetRouter.post(
  '/operations',
  validate(createBudgetOperationSchema),
  asyncHandler((req, res) => budgetController.createOperation(req, res)),
);
budgetRouter.patch(
  '/operations/:id',
  validate(budgetOperationIdParamsSchema, 'params'),
  validate(updateBudgetOperationSchema),
  asyncHandler((req, res) => budgetController.updateOperation(req, res)),
);
budgetRouter.delete(
  '/operations/:id',
  validate(budgetOperationIdParamsSchema, 'params'),
  asyncHandler((req, res) => budgetController.removeOperation(req, res)),
);

budgetRouter.post(
  '/mandatory',
  validate(createMandatoryPaymentSchema),
  asyncHandler((req, res) => budgetController.createMandatory(req, res)),
);
budgetRouter.patch(
  '/mandatory/:id',
  validate(mandatoryPaymentIdParamsSchema, 'params'),
  validate(updateMandatoryPaymentSchema),
  asyncHandler((req, res) => budgetController.updateMandatory(req, res)),
);
budgetRouter.delete(
  '/mandatory/:id',
  validate(mandatoryPaymentIdParamsSchema, 'params'),
  asyncHandler((req, res) => budgetController.removeMandatory(req, res)),
);
budgetRouter.post(
  '/mandatory/:id/toggle',
  validate(mandatoryPaymentIdParamsSchema, 'params'),
  validate(toggleMandatoryPaidSchema),
  asyncHandler((req, res) => budgetController.toggleMandatory(req, res)),
);

budgetRouter.post(
  '/planned',
  validate(createPlannedExpenseSchema),
  asyncHandler((req, res) => budgetController.createPlanned(req, res)),
);
budgetRouter.delete(
  '/planned/:id',
  validate(budgetOperationIdParamsSchema, 'params'),
  asyncHandler((req, res) => budgetController.removePlanned(req, res)),
);

budgetRouter.get('/statistics', asyncHandler((req, res) => budgetController.statistics(req, res)));
