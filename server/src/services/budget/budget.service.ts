import { BudgetCurrency, BudgetOperationType, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';
import {
  fxService,
  getLocalYearMonth,
  localMonthBounds,
} from '@/services/budget/fx.service.js';
import {
  formatLocalDateKey,
  parseLocalDateKey,
} from '@/services/planner/date.service.js';
import type {
  CreateBudgetCategoryInput,
  CreateBudgetOperationInput,
  CreateMandatoryPaymentInput,
  CreatePlannedExpenseInput,
  UpdateBudgetOperationInput,
  UpdateBudgetSettingsInput,
  UpdateMandatoryPaymentInput,
} from '@/validations/budget.schemas.js';

async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  if (!user) {
    throw new AppError('User not found', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  return user.timezone || 'Europe/Helsinki';
}

export class BudgetService {
  async getOrCreateSettings(userId: string) {
    const existing = await prisma.budgetSettings.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.budgetSettings.create({
      data: { userId },
    });
  }

  async updateSettings(userId: string, input: UpdateBudgetSettingsInput) {
    await this.getOrCreateSettings(userId);
    return prisma.budgetSettings.update({
      where: { userId },
      data: {
        displayCurrency: input.displayCurrency,
        openingBalance: input.openingBalance,
        openingCurrency: input.openingCurrency,
      },
    });
  }

  listCategories(userId: string) {
    return prisma.budgetCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(userId: string, input: CreateBudgetCategoryInput) {
    try {
      return await prisma.budgetCategory.create({
        data: { name: input.name, userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category already exists', {
          statusCode: 409,
          code: 'BUDGET_CATEGORY_TAKEN',
        });
      }
      throw error;
    }
  }

  async removeCategory(userId: string, id: string) {
    const category = await prisma.budgetCategory.findFirst({ where: { id, userId } });
    if (!category) {
      throw new AppError('Category not found', { statusCode: 404, code: 'BUDGET_CATEGORY_NOT_FOUND' });
    }
    await prisma.budgetCategory.delete({ where: { id } });
    return { success: true as const };
  }

  private async toDisplay(
    amount: number,
    from: BudgetCurrency,
    to: BudgetCurrency,
  ): Promise<number> {
    return fxService.convert(amount, from, to);
  }

  async createOperation(userId: string, input: CreateBudgetOperationInput) {
    const timezone = await getUserTimezone(userId);
    const settings = await this.getOrCreateSettings(userId);
    const currency = input.currency ?? settings.displayCurrency;
    const date = parseLocalDateKey(
      input.date.includes('T') ? formatLocalDateKey(new Date(input.date), timezone) : input.date,
      timezone,
    );

    if (input.categoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: { id: input.categoryId, userId },
      });
      if (!category) {
        throw new AppError('Category not found', { statusCode: 404, code: 'BUDGET_CATEGORY_NOT_FOUND' });
      }
    }

    return prisma.budgetOperation.create({
      data: {
        userId,
        date,
        amount: input.amount,
        currency,
        type: input.type,
        comment: input.comment ?? '',
        categoryId: input.categoryId ?? null,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateOperation(userId: string, id: string, input: UpdateBudgetOperationInput) {
    const timezone = await getUserTimezone(userId);
    const operation = await prisma.budgetOperation.findFirst({ where: { id, userId } });
    if (!operation) {
      throw new AppError('Operation not found', { statusCode: 404, code: 'BUDGET_OPERATION_NOT_FOUND' });
    }

    const date =
      input.date == null
        ? undefined
        : parseLocalDateKey(
            input.date.includes('T')
              ? formatLocalDateKey(new Date(input.date), timezone)
              : input.date,
            timezone,
          );

    return prisma.budgetOperation.update({
      where: { id },
      data: {
        date,
        amount: input.amount,
        currency: input.currency,
        type: input.type,
        comment: input.comment,
        categoryId: input.categoryId === undefined ? undefined : input.categoryId,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async removeOperation(userId: string, id: string) {
    const operation = await prisma.budgetOperation.findFirst({ where: { id, userId } });
    if (!operation) {
      throw new AppError('Operation not found', { statusCode: 404, code: 'BUDGET_OPERATION_NOT_FOUND' });
    }
    await prisma.budgetOperation.delete({ where: { id } });
    return { success: true as const };
  }

  async listMandatory(userId: string, year: number, month: number) {
    const payments = await prisma.mandatoryPayment.findMany({
      where: { userId, isActive: true },
      orderBy: [{ dayOfMonth: 'asc' }, { name: 'asc' }],
      include: {
        checks: { where: { year, month }, take: 1 },
      },
    });

    return payments.map((payment, index) => ({
      id: payment.id,
      index: index + 1,
      name: payment.name,
      dayOfMonth: payment.dayOfMonth,
      amount: payment.amount,
      currency: payment.currency,
      paid: payment.checks[0]?.paid ?? false,
      checkId: payment.checks[0]?.id ?? null,
    }));
  }

  async createMandatory(userId: string, input: CreateMandatoryPaymentInput) {
    const settings = await this.getOrCreateSettings(userId);
    return prisma.mandatoryPayment.create({
      data: {
        userId,
        name: input.name,
        dayOfMonth: input.dayOfMonth,
        amount: input.amount,
        currency: input.currency ?? settings.displayCurrency,
      },
    });
  }

  async updateMandatory(userId: string, id: string, input: UpdateMandatoryPaymentInput) {
    const payment = await prisma.mandatoryPayment.findFirst({ where: { id, userId } });
    if (!payment) {
      throw new AppError('Payment not found', { statusCode: 404, code: 'MANDATORY_NOT_FOUND' });
    }
    return prisma.mandatoryPayment.update({
      where: { id },
      data: {
        name: input.name,
        dayOfMonth: input.dayOfMonth,
        amount: input.amount,
        currency: input.currency,
        isActive: input.isActive,
      },
    });
  }

  async removeMandatory(userId: string, id: string) {
    const payment = await prisma.mandatoryPayment.findFirst({ where: { id, userId } });
    if (!payment) {
      throw new AppError('Payment not found', { statusCode: 404, code: 'MANDATORY_NOT_FOUND' });
    }
    await prisma.mandatoryPayment.delete({ where: { id } });
    return { success: true as const };
  }

  async toggleMandatoryPaid(
    userId: string,
    paymentId: string,
    year: number,
    month: number,
    paid: boolean,
  ) {
    const payment = await prisma.mandatoryPayment.findFirst({ where: { id: paymentId, userId } });
    if (!payment) {
      throw new AppError('Payment not found', { statusCode: 404, code: 'MANDATORY_NOT_FOUND' });
    }

    return prisma.mandatoryPaymentCheck.upsert({
      where: { paymentId_year_month: { paymentId, year, month } },
      create: {
        paymentId,
        userId,
        year,
        month,
        paid,
        paidAt: paid ? new Date() : null,
      },
      update: {
        paid,
        paidAt: paid ? new Date() : null,
      },
    });
  }

  async listPlanned(userId: string, year: number) {
    return prisma.plannedExpense.findMany({
      where: { userId, targetYear: year },
      orderBy: [{ targetMonth: 'asc' }, { name: 'asc' }],
    });
  }

  async createPlanned(userId: string, input: CreatePlannedExpenseInput) {
    const settings = await this.getOrCreateSettings(userId);
    return prisma.plannedExpense.create({
      data: {
        userId,
        name: input.name,
        amount: input.amount,
        currency: input.currency ?? settings.displayCurrency,
        targetYear: input.targetYear,
        targetMonth: input.targetMonth ?? null,
      },
    });
  }

  async removePlanned(userId: string, id: string) {
    const item = await prisma.plannedExpense.findFirst({ where: { id, userId } });
    if (!item) {
      throw new AppError('Planned expense not found', {
        statusCode: 404,
        code: 'PLANNED_NOT_FOUND',
      });
    }
    await prisma.plannedExpense.delete({ where: { id } });
    return { success: true as const };
  }

  async getMonthOverview(userId: string, year: number, month: number) {
    const timezone = await getUserTimezone(userId);
    const settings = await this.getOrCreateSettings(userId);
    const display = settings.displayCurrency;
    const fx = await fxService.getTodayRatesPayload();
    const { startUtc, endUtc } = localMonthBounds(year, month, timezone);

    const openingBalance = await this.computeOpeningBalance(userId, year, month, timezone, display);

    const operations = await prisma.budgetOperation.findMany({
      where: { userId, date: { gte: startUtc, lte: endUtc } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    let income = 0;
    let expenses = 0;
    const mappedOps = [];

    for (const op of operations) {
      const amount = await this.toDisplay(op.amount, op.currency, display);
      if (op.type === BudgetOperationType.INCOME) income += amount;
      else expenses += amount;

      mappedOps.push({
        ...op,
        amountDisplay: amount,
        dateKey: formatLocalDateKey(op.date, timezone),
      });
    }

    const mandatory = await this.listMandatory(userId, year, month);
    let mandatoryTotal = 0;
    const mandatoryMapped = [];
    for (const item of mandatory) {
      const amount = await this.toDisplay(item.amount, item.currency, display);
      mandatoryTotal += amount;
      mandatoryMapped.push({ ...item, amountDisplay: amount });
    }

    const difference = income - expenses;
    const closingBalance = openingBalance + income - expenses;
    const now = getLocalYearMonth(new Date(), timezone);
    const currentBalance =
      year === now.year && month === now.month
        ? closingBalance
        : year < now.year || (year === now.year && month < now.month)
          ? closingBalance
          : openingBalance;

    return {
      timezone,
      year,
      month,
      displayCurrency: display,
      fx,
      overview: {
        openingBalance: round2(openingBalance),
        closingBalance: round2(closingBalance),
        currentBalance: round2(currentBalance),
        income: round2(income),
        expenses: round2(expenses),
        mandatoryPayments: round2(mandatoryTotal),
        difference: round2(difference),
      },
      operations: mappedOps,
      mandatory: mandatoryMapped,
      settings,
    };
  }

  async getYearOverview(userId: string, year: number) {
    const timezone = await getUserTimezone(userId);
    const settings = await this.getOrCreateSettings(userId);
    const display = settings.displayCurrency;
    const fx = await fxService.getTodayRatesPayload();

    const months = [];
    let opening = await this.computeOpeningBalance(userId, year, 1, timezone, display);
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalMandatory = 0;
    let totalDifference = 0;

    for (let month = 1; month <= 12; month += 1) {
      const { startUtc, endUtc } = localMonthBounds(year, month, timezone);
      const operations = await prisma.budgetOperation.findMany({
        where: { userId, date: { gte: startUtc, lte: endUtc } },
        select: { amount: true, currency: true, type: true },
      });

      let income = 0;
      let expenses = 0;
      for (const op of operations) {
        const amount = await this.toDisplay(op.amount, op.currency, display);
        if (op.type === BudgetOperationType.INCOME) income += amount;
        else expenses += amount;
      }

      const mandatory = await this.listMandatory(userId, year, month);
      let mandatoryTotal = 0;
      for (const item of mandatory) {
        mandatoryTotal += await this.toDisplay(item.amount, item.currency, display);
      }

      const difference = income - expenses;
      const closing = opening + income - expenses;

      months.push({
        month,
        openingBalance: round2(opening),
        income: round2(income),
        expenses: round2(expenses),
        mandatoryPayments: round2(mandatoryTotal),
        difference: round2(difference),
        closingBalance: round2(closing),
      });

      totalIncome += income;
      totalExpenses += expenses;
      totalMandatory += mandatoryTotal;
      totalDifference += difference;
      opening = closing;
    }

    const planned = await this.listPlanned(userId, year + 1);
    const plannedMapped = [];
    for (const item of planned) {
      plannedMapped.push({
        ...item,
        amountDisplay: await this.toDisplay(item.amount, item.currency, display),
      });
    }

    return {
      timezone,
      year,
      displayCurrency: display,
      fx,
      openingBalance: months[0]?.openingBalance ?? 0,
      months,
      totals: {
        income: round2(totalIncome),
        expenses: round2(totalExpenses),
        mandatoryPayments: round2(totalMandatory),
        difference: round2(totalDifference),
        closingBalance: months[11]?.closingBalance ?? 0,
      },
      plannedNextYear: plannedMapped,
      settings,
    };
  }

  /** Opening balance for a month = settings opening + all prior ops converted at today's rate. */
  private async computeOpeningBalance(
    userId: string,
    year: number,
    month: number,
    timezone: string,
    display: BudgetCurrency,
  ): Promise<number> {
    const settings = await this.getOrCreateSettings(userId);
    let balance = await this.toDisplay(
      settings.openingBalance,
      settings.openingCurrency,
      display,
    );

    const { startUtc } = localMonthBounds(year, month, timezone);
    const priorOps = await prisma.budgetOperation.findMany({
      where: { userId, date: { lt: startUtc } },
      select: { amount: true, currency: true, type: true },
    });

    for (const op of priorOps) {
      const amount = await this.toDisplay(op.amount, op.currency, display);
      balance += op.type === BudgetOperationType.INCOME ? amount : -amount;
    }

    return balance;
  }

  async getStatistics(userId: string) {
    const timezone = await getUserTimezone(userId);
    const { year, month } = getLocalYearMonth(new Date(), timezone);
    const monthData = await this.getMonthOverview(userId, year, month);
    const paidMandatory = monthData.mandatory.filter((item) => item.paid).length;
    const mandatoryCount = monthData.mandatory.length;

    return {
      timezone,
      stats: {
        currentBalance: monthData.overview.currentBalance,
        monthIncome: monthData.overview.income,
        monthExpenses: monthData.overview.expenses,
        mandatoryPaid: paidMandatory,
        mandatoryTotal: mandatoryCount,
        displayCurrency: monthData.displayCurrency,
      },
    };
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export const budgetService = new BudgetService();
