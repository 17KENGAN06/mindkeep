import { BudgetCurrency, BudgetOperationType, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type {
  CreateFinanceCategoryInput,
  CreateFinanceOperationInput,
  FinancePeriodQuery,
  UpdateFinanceCategoryInput,
  UpdateFinanceSettingsInput,
} from '@/validations/finance.schemas.js';
import { AppError } from '@/utils/AppError.js';

const CURRENCY_ORDER: BudgetCurrency[] = [
  BudgetCurrency.EUR,
  BudgetCurrency.USD,
  BudgetCurrency.UAH,
  BudgetCurrency.RUB,
];

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function periodRange(query: FinancePeriodQuery): { from: Date; to: Date } {
  if (query.view === 'year') {
    return {
      from: new Date(Date.UTC(query.year, 0, 1)),
      to: new Date(Date.UTC(query.year + 1, 0, 1)),
    };
  }

  const month = query.month ?? new Date().getUTCMonth() + 1;
  return {
    from: new Date(Date.UTC(query.year, month - 1, 1)),
    to: new Date(Date.UTC(query.year, month, 1)),
  };
}

function parseOperationDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  }
  return new Date(value);
}

function sortCurrencies(currencies: Iterable<BudgetCurrency>): BudgetCurrency[] {
  return [...currencies].sort(
    (a, b) => CURRENCY_ORDER.indexOf(a) - CURRENCY_ORDER.indexOf(b),
  );
}

type CurrencyBucket = {
  currency: BudgetCurrency;
  income: number;
  expense: number;
  balance: number;
};

function emptyBucket(currency: BudgetCurrency): CurrencyBucket {
  return { currency, income: 0, expense: 0, balance: 0 };
}

function finalizeBucket(bucket: CurrencyBucket): CurrencyBucket {
  return {
    currency: bucket.currency,
    income: roundMoney(bucket.income),
    expense: roundMoney(bucket.expense),
    balance: roundMoney(bucket.income - bucket.expense),
  };
}

export class FinanceService {
  async getOrCreateSettings(userId: string) {
    const existing = await prisma.budgetSettings.findUnique({ where: { userId } });
    if (existing) return existing;

    return prisma.budgetSettings.create({
      data: {
        userId,
        displayCurrency: BudgetCurrency.EUR,
        openingCurrency: BudgetCurrency.EUR,
        openingBalance: 0,
      },
    });
  }

  async updateSettings(userId: string, input: UpdateFinanceSettingsInput) {
    await this.getOrCreateSettings(userId);
    return prisma.budgetSettings.update({
      where: { userId },
      data: {
        displayCurrency: input.displayCurrency,
        ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
        ...(input.openingCurrency ? { openingCurrency: input.openingCurrency } : {}),
      },
    });
  }

  listCategories(userId: string) {
    return prisma.budgetCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { operations: true } } },
    });
  }

  async createCategory(userId: string, input: CreateFinanceCategoryInput) {
    try {
      return await prisma.budgetCategory.create({
        data: { name: input.name, userId },
        include: { _count: { select: { operations: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category with this name already exists', {
          statusCode: 409,
          code: 'FINANCE_CATEGORY_NAME_TAKEN',
        });
      }
      throw error;
    }
  }

  async updateCategory(userId: string, id: string, input: UpdateFinanceCategoryInput) {
    const category = await prisma.budgetCategory.findFirst({ where: { id, userId } });
    if (!category) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'FINANCE_CATEGORY_NOT_FOUND',
      });
    }

    try {
      return await prisma.budgetCategory.update({
        where: { id },
        data: { name: input.name },
        include: { _count: { select: { operations: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category with this name already exists', {
          statusCode: 409,
          code: 'FINANCE_CATEGORY_NAME_TAKEN',
        });
      }
      throw error;
    }
  }

  async removeCategory(userId: string, id: string) {
    const category = await prisma.budgetCategory.findFirst({ where: { id, userId } });
    if (!category) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'FINANCE_CATEGORY_NOT_FOUND',
      });
    }

    await prisma.budgetCategory.delete({ where: { id } });
    return { success: true };
  }

  async listOperations(userId: string, query: FinancePeriodQuery) {
    const { from, to } = periodRange(query);
    const settings = await this.getOrCreateSettings(userId);

    const operations = await prisma.budgetOperation.findMany({
      where: {
        userId,
        date: { gte: from, lt: to },
      },
      include: { category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return { settings, operations };
  }

  async createOperation(userId: string, input: CreateFinanceOperationInput) {
    const settings = await this.getOrCreateSettings(userId);

    if (input.categoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new AppError('Category not found', {
          statusCode: 404,
          code: 'FINANCE_CATEGORY_NOT_FOUND',
        });
      }
    }

    const operation = await prisma.budgetOperation.create({
      data: {
        userId,
        type: input.type,
        amount: input.amount,
        currency: input.currency ?? settings.displayCurrency,
        date: parseOperationDate(input.date),
        comment: input.comment ?? '',
        categoryId: input.categoryId ?? null,
      },
      include: { category: true },
    });

    return operation;
  }

  async removeOperation(userId: string, id: string) {
    const operation = await prisma.budgetOperation.findFirst({ where: { id, userId } });
    if (!operation) {
      throw new AppError('Operation not found', {
        statusCode: 404,
        code: 'FINANCE_OPERATION_NOT_FOUND',
      });
    }

    await prisma.budgetOperation.delete({ where: { id } });
    return { success: true };
  }

  async getSummary(userId: string, query: FinancePeriodQuery) {
    const { from, to } = periodRange(query);
    const settings = await this.getOrCreateSettings(userId);

    const operations = await prisma.budgetOperation.findMany({
      where: {
        userId,
        date: { gte: from, lt: to },
      },
      include: { category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const totalsMap = new Map<BudgetCurrency, CurrencyBucket>();
    const byCategoryMap = new Map<
      string,
      {
        id: string | null;
        name: string;
        expenses: Map<BudgetCurrency, number>;
      }
    >();
    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      byCurrency: new Map<BudgetCurrency, CurrencyBucket>(),
    }));

    for (const op of operations) {
      const bucket = totalsMap.get(op.currency) ?? emptyBucket(op.currency);
      if (op.type === BudgetOperationType.INCOME) {
        bucket.income += op.amount;
      } else {
        bucket.expense += op.amount;
        const key = op.categoryId ?? 'uncategorized';
        const category = byCategoryMap.get(key) ?? {
          id: op.categoryId,
          name: op.category?.name ?? '—',
          expenses: new Map<BudgetCurrency, number>(),
        };
        category.expenses.set(
          op.currency,
          roundMoney((category.expenses.get(op.currency) ?? 0) + op.amount),
        );
        byCategoryMap.set(key, category);
      }
      totalsMap.set(op.currency, bucket);

      if (query.view === 'year') {
        const monthBucket = byMonth[op.date.getUTCMonth()]!;
        const monthCurrency =
          monthBucket.byCurrency.get(op.currency) ?? emptyBucket(op.currency);
        if (op.type === BudgetOperationType.INCOME) {
          monthCurrency.income += op.amount;
        } else {
          monthCurrency.expense += op.amount;
        }
        monthBucket.byCurrency.set(op.currency, monthCurrency);
      }
    }

    // Include opening currency in totals view only as metadata — not mixed into period ops.
    const totalsByCurrency = sortCurrencies(totalsMap.keys()).map((currency) =>
      finalizeBucket(totalsMap.get(currency)!),
    );

    const byCategory = [...byCategoryMap.values()]
      .map((item) => ({
        id: item.id,
        name: item.name,
        expenses: sortCurrencies(item.expenses.keys()).map((currency) => ({
          currency,
          expense: item.expenses.get(currency) ?? 0,
        })),
      }))
      .sort((a, b) => {
        const sumA = a.expenses.reduce((s, e) => s + e.expense, 0);
        const sumB = b.expenses.reduce((s, e) => s + e.expense, 0);
        return sumB - sumA;
      });

    return {
      settings,
      period: {
        view: query.view,
        year: query.year,
        month: query.view === 'month' ? (query.month ?? null) : null,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totalsByCurrency,
      opening: {
        amount: roundMoney(settings.openingBalance),
        currency: settings.openingCurrency,
      },
      byCategory,
      byMonth:
        query.view === 'year'
          ? byMonth.map((item) => ({
              month: item.month,
              byCurrency: sortCurrencies(item.byCurrency.keys()).map((currency) =>
                finalizeBucket(item.byCurrency.get(currency)!),
              ),
            }))
          : [],
      operations,
    };
  }
}

export const financeService = new FinanceService();
