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

const DEFAULT_CURRENCY = BudgetCurrency.EUR;

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

export class FinanceService {
  async getOrCreateSettings(userId: string) {
    const existing = await prisma.budgetSettings.findUnique({ where: { userId } });
    if (existing) return existing;

    return prisma.budgetSettings.create({
      data: {
        userId,
        displayCurrency: DEFAULT_CURRENCY,
        openingCurrency: DEFAULT_CURRENCY,
        openingBalance: 0,
      },
    });
  }

  async updateSettings(userId: string, input: UpdateFinanceSettingsInput) {
    await this.getOrCreateSettings(userId);
    return prisma.budgetSettings.update({
      where: { userId },
      data: {
        displayCurrency: DEFAULT_CURRENCY,
        openingCurrency: DEFAULT_CURRENCY,
        ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
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
    await this.getOrCreateSettings(userId);

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

    return prisma.budgetOperation.create({
      data: {
        userId,
        type: input.type,
        amount: input.amount,
        currency: DEFAULT_CURRENCY,
        date: parseOperationDate(input.date),
        comment: input.comment ?? '',
        categoryId: input.categoryId ?? null,
      },
      include: { category: true },
    });
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

    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, { id: string | null; name: string; expense: number }>();
    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      income: 0,
      expense: 0,
      balance: 0,
    }));

    for (const op of operations) {
      if (op.type === BudgetOperationType.INCOME) {
        income += op.amount;
      } else {
        expense += op.amount;
        const key = op.categoryId ?? 'uncategorized';
        const current = byCategory.get(key) ?? {
          id: op.categoryId,
          name: op.category?.name ?? '—',
          expense: 0,
        };
        current.expense = roundMoney(current.expense + op.amount);
        byCategory.set(key, current);
      }

      if (query.view === 'year') {
        const bucket = byMonth[op.date.getUTCMonth()]!;
        if (op.type === BudgetOperationType.INCOME) {
          bucket.income = roundMoney(bucket.income + op.amount);
        } else {
          bucket.expense = roundMoney(bucket.expense + op.amount);
        }
        bucket.balance = roundMoney(bucket.income - bucket.expense);
      }
    }

    const openingBalance = roundMoney(settings.openingBalance);

    return {
      settings: {
        ...settings,
        displayCurrency: DEFAULT_CURRENCY,
        openingCurrency: DEFAULT_CURRENCY,
      },
      currency: DEFAULT_CURRENCY,
      period: {
        view: query.view,
        year: query.year,
        month: query.view === 'month' ? (query.month ?? null) : null,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals: {
        income: roundMoney(income),
        expense: roundMoney(expense),
        balance: roundMoney(income - expense),
        openingBalance,
        netWithOpening: roundMoney(openingBalance + income - expense),
      },
      byCategory: [...byCategory.values()].sort((a, b) => b.expense - a.expense),
      byMonth: query.view === 'year' ? byMonth : [],
      operations,
    };
  }
}

export const financeService = new FinanceService();
