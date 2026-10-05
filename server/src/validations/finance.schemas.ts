import { z } from 'zod';
import { BudgetCurrency, BudgetMoneyKind, BudgetOperationType } from '@prisma/client';

export const financeOperationTypeSchema = z.nativeEnum(BudgetOperationType);
export const financeMoneyKindSchema = z.nativeEnum(BudgetMoneyKind);
export const financeCurrencySchema = z.nativeEnum(BudgetCurrency);

export const updateFinanceSettingsSchema = z.object({
  openingBalance: z.number().finite().optional(),
  displayCurrency: financeCurrencySchema.optional(),
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
  moneyKind: financeMoneyKindSchema.optional().default(BudgetMoneyKind.ELECTRONIC),
  currency: financeCurrencySchema.optional().default(BudgetCurrency.EUR),
  amount: z.number().positive().max(1_000_000_000),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  comment: z.string().trim().max(500).optional().default(''),
  categoryId: z.string().min(1).nullable().optional(),
});

export const bulkCreateFinanceOperationsSchema = z.object({
  operations: z.array(createFinanceOperationSchema).min(1).max(40),
});

export const repeatFinanceMonthSchema = z
  .object({
    fromYear: z.number().int().min(2000).max(2100),
    fromMonth: z.number().int().min(1).max(12),
    toYear: z.number().int().min(2000).max(2100),
    toMonth: z.number().int().min(1).max(12),
  })
  .refine((value) => value.fromYear !== value.toYear || value.fromMonth !== value.toMonth, {
    message: 'Pick a different month',
  });

const financeScanMimeType = z.enum(['image/jpeg', 'image/png', 'image/webp']);

export const scanFinanceSchema = z.object({
  image: z
    .string()
    .min(80)
    .max(900_000)
    .transform((value) => {
      const trimmed = value.trim();
      const comma = trimmed.indexOf(',');
      return trimmed.startsWith('data:') && comma !== -1 ? trimmed.slice(comma + 1) : trimmed;
    }),
  mimeType: financeScanMimeType,
  fallbackCurrency: financeCurrencySchema.optional(),
});

export type UpdateFinanceSettingsInput = z.infer<typeof updateFinanceSettingsSchema>;
export type CreateFinanceCategoryInput = z.infer<typeof createFinanceCategorySchema>;
export type UpdateFinanceCategoryInput = z.infer<typeof updateFinanceCategorySchema>;
export type FinancePeriodQuery = z.infer<typeof financePeriodQuerySchema>;
export type CreateFinanceOperationInput = z.infer<typeof createFinanceOperationSchema>;
export type BulkCreateFinanceOperationsInput = z.infer<typeof bulkCreateFinanceOperationsSchema>;
export type RepeatFinanceMonthInput = z.infer<typeof repeatFinanceMonthSchema>;
export type ScanFinanceInput = z.infer<typeof scanFinanceSchema>;
