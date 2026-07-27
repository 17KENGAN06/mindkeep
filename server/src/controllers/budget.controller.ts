import type { Request, Response } from 'express';
import { budgetService } from '@/services/budget/budget.service.js';
import { fxService } from '@/services/budget/fx.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateBudgetCategoryInput,
  CreateBudgetOperationInput,
  CreateMandatoryPaymentInput,
  CreatePlannedExpenseInput,
  UpdateBudgetOperationInput,
  UpdateBudgetSettingsInput,
  UpdateMandatoryPaymentInput,
} from '@/validations/budget.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  return req.user.id;
}

export class BudgetController {
  async getSettings(req: Request, res: Response): Promise<void> {
    const settings = await budgetService.getOrCreateSettings(requireUserId(req));
    const fx = await fxService.getTodayRatesPayload();
    res.status(200).json({ settings, fx });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const settings = await budgetService.updateSettings(
      requireUserId(req),
      req.body as UpdateBudgetSettingsInput,
    );
    res.status(200).json({ settings });
  }

  async listCategories(req: Request, res: Response): Promise<void> {
    const categories = await budgetService.listCategories(requireUserId(req));
    res.status(200).json({ categories });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const category = await budgetService.createCategory(
      requireUserId(req),
      req.body as CreateBudgetCategoryInput,
    );
    res.status(201).json({ category });
  }

  async removeCategory(req: Request, res: Response): Promise<void> {
    const result = await budgetService.removeCategory(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async createOperation(req: Request, res: Response): Promise<void> {
    const operation = await budgetService.createOperation(
      requireUserId(req),
      req.body as CreateBudgetOperationInput,
    );
    res.status(201).json({ operation });
  }

  async updateOperation(req: Request, res: Response): Promise<void> {
    const operation = await budgetService.updateOperation(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateBudgetOperationInput,
    );
    res.status(200).json({ operation });
  }

  async removeOperation(req: Request, res: Response): Promise<void> {
    const result = await budgetService.removeOperation(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async month(req: Request, res: Response): Promise<void> {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const result = await budgetService.getMonthOverview(requireUserId(req), year, month);
    res.status(200).json(result);
  }

  async year(req: Request, res: Response): Promise<void> {
    const year = Number(req.query.year);
    const result = await budgetService.getYearOverview(requireUserId(req), year);
    res.status(200).json(result);
  }

  async createMandatory(req: Request, res: Response): Promise<void> {
    const payment = await budgetService.createMandatory(
      requireUserId(req),
      req.body as CreateMandatoryPaymentInput,
    );
    res.status(201).json({ payment });
  }

  async updateMandatory(req: Request, res: Response): Promise<void> {
    const payment = await budgetService.updateMandatory(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateMandatoryPaymentInput,
    );
    res.status(200).json({ payment });
  }

  async removeMandatory(req: Request, res: Response): Promise<void> {
    const result = await budgetService.removeMandatory(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async toggleMandatory(req: Request, res: Response): Promise<void> {
    const body = req.body as { year: number; month: number; paid: boolean };
    const check = await budgetService.toggleMandatoryPaid(
      requireUserId(req),
      req.params.id as string,
      body.year,
      body.month,
      body.paid,
    );
    res.status(200).json({ check });
  }

  async createPlanned(req: Request, res: Response): Promise<void> {
    const planned = await budgetService.createPlanned(
      requireUserId(req),
      req.body as CreatePlannedExpenseInput,
    );
    res.status(201).json({ planned });
  }

  async removePlanned(req: Request, res: Response): Promise<void> {
    const result = await budgetService.removePlanned(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async statistics(req: Request, res: Response): Promise<void> {
    const result = await budgetService.getStatistics(requireUserId(req));
    res.status(200).json(result);
  }
}

export const budgetController = new BudgetController();
