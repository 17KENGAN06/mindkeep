import { z } from 'zod';
import { BudgetOperationType } from '@prisma/client';

export const financeOperationTypeSchema = z.nativeEnum(BudgetOperationType);

export const updateFinanceSettingsSchema = z.object({
  openingBalance: z.number().finite().optional(),
});

export const createFinanceCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const updateFinanceCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const financeIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const financePeriodQuerySchema = z
  .object({
    view: z.enum(['month', 'year']).default('month'),
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .transform((value) => {
    if (value.view === 'month' && value.month == null) {
      return { ...value, month: new Date().getUTCMonth() + 1 };
    }
    return value;
  });

export const createFinanceOperationSchema = z.object({
  type: financeOperationTypeSchema,
  amount: z.number().positive().max(1_000_000_000),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  comment: z.string().trim().max(500).optional().default(''),
  categoryId: z.string().min(1).nullable().optional(),
});

export type UpdateFinanceSettingsInput = z.infer<typeof updateFinanceSettingsSchema>;
export type CreateFinanceCategoryInput = z.infer<typeof createFinanceCategorySchema>;
export type UpdateFinanceCategoryInput = z.infer<typeof updateFinanceCategorySchema>;
export type FinancePeriodQuery = z.infer<typeof financePeriodQuerySchema>;
export type CreateFinanceOperationInput = z.infer<typeof createFinanceOperationSchema>;
