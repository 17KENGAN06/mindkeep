import { z } from 'zod';

export const budgetCurrencySchema = z.enum(['RUB', 'USD', 'EUR', 'UAH']);
export const budgetOperationTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const updateBudgetSettingsSchema = z.object({
  displayCurrency: budgetCurrencySchema.optional(),
  openingBalance: z.number().finite().optional(),
  openingCurrency: budgetCurrencySchema.optional(),
});

export const createBudgetCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const createBudgetOperationSchema = z.object({
  date: z.string().min(1),
  amount: z.number().positive(),
  currency: budgetCurrencySchema.optional(),
  type: budgetOperationTypeSchema,
  comment: z.string().trim().max(500).optional().default(''),
  categoryId: z.string().cuid().nullable().optional(),
});

export const updateBudgetOperationSchema = createBudgetOperationSchema.partial();

export const budgetOperationIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

export const createMandatoryPaymentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dayOfMonth: z.number().int().min(1).max(28),
  amount: z.number().positive(),
  currency: budgetCurrencySchema.optional(),
});

export const updateMandatoryPaymentSchema = createMandatoryPaymentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const mandatoryPaymentIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleMandatoryPaidSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  paid: z.boolean(),
});

export const createPlannedExpenseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  currency: budgetCurrencySchema.optional(),
  targetYear: z.number().int().min(2000).max(2100),
  targetMonth: z.number().int().min(1).max(12).nullable().optional(),
});

export type UpdateBudgetSettingsInput = z.infer<typeof updateBudgetSettingsSchema>;
export type CreateBudgetOperationInput = z.infer<typeof createBudgetOperationSchema>;
export type UpdateBudgetOperationInput = z.infer<typeof updateBudgetOperationSchema>;
export type CreateMandatoryPaymentInput = z.infer<typeof createMandatoryPaymentSchema>;
export type UpdateMandatoryPaymentInput = z.infer<typeof updateMandatoryPaymentSchema>;
export type CreatePlannedExpenseInput = z.infer<typeof createPlannedExpenseSchema>;
export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;
