import { BudgetCurrency, BudgetMoneyKind, BudgetOperationType, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { convertAmount, getRateMap } from '@/services/exchangeRate.service.js';
import { applyMonthlyLimit, parseMonthlyLimits } from '@/services/finance-limits.js';
import type {
  BulkCreateFinanceOperationsInput,
  CreateFinanceCategoryInput,
  CreateFinanceOperationInput,
  FinancePeriodQuery,
  UpdateFinanceCategoryInput,
  UpdateFinanceSettingsInput,
} from '@/validations/finance.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { requireDeleted, requireOwned } from '@/utils/owned.js';
import { FREE_LIMITS } from '@/config/entitlements.js';
import {
  assertCreateLimit,
  dateKeyOf,
  freeVisibleIds,
  getEntitlement,
  idIn,
  maybeCapMonthly,
} from '@/services/entitlements.service.js';

const DEFAULT_CURRENCY = BudgetCurrency.EUR;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function presentSettings<T extends { monthlyLimits?: unknown }>(settings: T) {
  return {
    ...settings,
    monthlyLimits: parseMonthlyLimits(settings.monthlyLimits),
  };
}

function emptyKindTotals() {
  return { income: 0, expense: 0, balance: 0 };
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

async function requireFinanceImportPro(userId: string): Promise<void> {
  const entitlement = await getEntitlement(userId);
  if (!entitlement.pro) {
    throw new AppError('Finance import is included in Pro', {
      statusCode: 403,
      code: 'FINANCE_IMPORT_PRO_REQUIRED',
    });
  }
}

export class FinanceService {
  async getOrCreateSettings(userId: string) {
    const existing = await prisma.budgetSettings.findUnique({ where: { userId } });
    if (existing) return presentSettings(existing);

    return presentSettings(
      await prisma.budgetSettings.create({
        data: {
          userId,
          displayCurrency: DEFAULT_CURRENCY,
          openingCurrency: DEFAULT_CURRENCY,
          openingBalance: 0,
        },
      }),
    );
  }

  async updateSettings(userId: string, input: UpdateFinanceSettingsInput) {
    const current = await this.getOrCreateSettings(userId);
    const monthlyLimits = input.monthlyLimit
      ? applyMonthlyLimit(current.monthlyLimits, input.monthlyLimit.currency, input.monthlyLimit.amount)
      : current.monthlyLimits;

    return presentSettings(
      await prisma.budgetSettings.update({
        where: { userId },
        data: {
          ...(input.displayCurrency
            ? { displayCurrency: input.displayCurrency, openingCurrency: input.displayCurrency }
            : {}),
          ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
          ...(input.monthlyLimit ? { monthlyLimits } : {}),
        },
      }),
    );
  }

  async listCategories(userId: string) {
    const visibleIds = await freeVisibleIds(userId, 'financeCategories');
    return prisma.budgetCategory.findMany({
      where: { userId, ...idIn(visibleIds) },
      orderBy: { name: 'asc' },
      include: { _count: { select: { operations: true } } },
    });
  }

  async createCategory(userId: string, input: CreateFinanceCategoryInput) {
    await assertCreateLimit(userId, 'financeCategories');
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
    requireOwned(
      await prisma.budgetCategory.findFirst({ where: { id, userId } }),
      'Category not found',
      'FINANCE_CATEGORY_NOT_FOUND',
    );

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
    const result = await prisma.budgetCategory.deleteMany({ where: { id, userId } });
    requireDeleted(result.count, 'Category not found', 'FINANCE_CATEGORY_NOT_FOUND');
    return { success: true };
  }

  async listOperations(userId: string, query: FinancePeriodQuery) {
    const { from, to } = periodRange(query);
    const settings = await this.getOrCreateSettings(userId);

    const operations = await maybeCapMonthly(
      userId,
      FREE_LIMITS.financeOperationsPerMonth,
      await prisma.budgetOperation.findMany({
        where: {
          userId,
          date: { gte: from, lt: to },
        },
        include: { category: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      (row) => row.date,
      (row) => row.createdAt.getTime(),
    );

    return { settings: presentSettings(settings), operations };
  }

  async createOperation(userId: string, input: CreateFinanceOperationInput) {
    await this.getOrCreateSettings(userId);
    await assertCreateLimit(userId, 'financeOperations', { dateKey: dateKeyOf(input.date) });

    if (input.categoryId) {
      requireOwned(
        await prisma.budgetCategory.findFirst({
          where: { id: input.categoryId, userId },
        }),
        'Category not found',
        'FINANCE_CATEGORY_NOT_FOUND',
      );
    }

    return prisma.budgetOperation.create({
      data: {
        userId,
        type: input.type,
        moneyKind: input.moneyKind ?? BudgetMoneyKind.ELECTRONIC,
        amount: input.amount,
        currency: input.currency ?? DEFAULT_CURRENCY,
        date: parseOperationDate(input.date),
        comment: input.comment ?? '',
        categoryId: input.categoryId ?? null,
      },
      include: { category: true },
    });
  }

  async bulkCreate(userId: string, input: BulkCreateFinanceOperationsInput) {
    await requireFinanceImportPro(userId);
    await this.getOrCreateSettings(userId);

    const categoryIds = [
      ...new Set(input.operations.map((row) => row.categoryId).filter((id): id is string => Boolean(id))),
    ];
    if (categoryIds.length > 0) {
      const owned = await prisma.budgetCategory.findMany({
        where: { userId, id: { in: categoryIds } },
        select: { id: true },
      });
      if (owned.length !== categoryIds.length) {
        throw new AppError('Category not found', {
          statusCode: 404,
          code: 'FINANCE_CATEGORY_NOT_FOUND',
        });
      }
    }

    const result = await prisma.budgetOperation.createMany({
      data: input.operations.map((row) => ({
        userId,
        type: row.type,
        moneyKind: row.moneyKind ?? BudgetMoneyKind.ELECTRONIC,
        amount: row.amount,
        currency: row.currency ?? DEFAULT_CURRENCY,
        date: parseOperationDate(row.date),
        comment: row.comment ?? '',
        categoryId: row.categoryId ?? null,
      })),
    });

    return { created: result.count };
  }

  async removeOperation(userId: string, id: string) {
    const result = await prisma.budgetOperation.deleteMany({ where: { id, userId } });
    requireDeleted(result.count, 'Operation not found', 'FINANCE_OPERATION_NOT_FOUND');
    return { success: true };
  }

  async getSummary(userId: string, query: FinancePeriodQuery) {
    const { from, to } = periodRange(query);
    const settings = await this.getOrCreateSettings(userId);

    const operations = await maybeCapMonthly(
      userId,
      FREE_LIMITS.financeOperationsPerMonth,
      await prisma.budgetOperation.findMany({
        where: {
          userId,
          date: { gte: from, lt: to },
        },
        include: { category: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      (row) => row.date,
      (row) => row.createdAt.getTime(),
    );

    const display = settings.displayCurrency;
    let rates: Awaited<ReturnType<typeof getRateMap>>['rates'] | null = null;
    try {
      rates = (await getRateMap()).rates;
    } catch {
      rates = null;
    }

    const toDisplay = (amount: number, currency: BudgetCurrency) => {
      if (!rates || currency === display) return amount;
      return roundMoney(convertAmount(amount, currency, display, rates));
    };

    let income = 0;
    let expense = 0;
    const byKind = {
      CASH: emptyKindTotals(),
      ELECTRONIC: emptyKindTotals(),
    };
    const byCategory = new Map<string, { id: string | null; name: string; expense: number }>();
    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      income: 0,
      expense: 0,
      balance: 0,
    }));

    for (const op of operations) {
      const amount = toDisplay(op.amount, op.currency);
      const kind = op.moneyKind === BudgetMoneyKind.CASH ? 'CASH' : 'ELECTRONIC';
      if (op.type === BudgetOperationType.INCOME) {
        income += amount;
        byKind[kind].income = roundMoney(byKind[kind].income + amount);
      } else {
        expense += amount;
        byKind[kind].expense = roundMoney(byKind[kind].expense + amount);
        const key = op.categoryId ?? 'uncategorized';
        const current = byCategory.get(key) ?? {
          id: op.categoryId,
          name: op.category?.name ?? '—',
          expense: 0,
        };
        current.expense = roundMoney(current.expense + amount);
        byCategory.set(key, current);
      }

      byKind[kind].balance = roundMoney(byKind[kind].income - byKind[kind].expense);

      if (query.view === 'year') {
        const bucket = byMonth[op.date.getUTCMonth()]!;
        if (op.type === BudgetOperationType.INCOME) {
          bucket.income = roundMoney(bucket.income + amount);
        } else {
          bucket.expense = roundMoney(bucket.expense + amount);
        }
        bucket.balance = roundMoney(bucket.income - bucket.expense);
      }
    }

    const openingBalance = roundMoney(toDisplay(settings.openingBalance, settings.openingCurrency));

    return {
      settings,
      currency: display,
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
      totalsByKind: byKind,
      byCategory: [...byCategory.values()].sort((a, b) => b.expense - a.expense),
      byMonth: query.view === 'year' ? byMonth : [],
      operations,
    };
  }
}

export const financeService = new FinanceService();
