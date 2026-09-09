import type { Request, Response } from 'express';
import { financeService } from '@/services/finance.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateFinanceCategoryInput,
  CreateFinanceOperationInput,
  FinancePeriodQuery,
  UpdateFinanceCategoryInput,
  UpdateFinanceSettingsInput,
} from '@/validations/finance.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class FinanceController {
  async getSettings(req: Request, res: Response): Promise<void> {
    const settings = await financeService.getOrCreateSettings(requireUserId(req));
    res.status(200).json({ settings });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const settings = await financeService.updateSettings(
      requireUserId(req),
      req.body as UpdateFinanceSettingsInput,
    );
    res.status(200).json({ settings });
  }

  async getRates(req: Request, res: Response): Promise<void> {
    requireUserId(req);
    const rates = await financeService.getRates();
    res.status(200).json(rates);
  }

  async listCategories(req: Request, res: Response): Promise<void> {
    const categories = await financeService.listCategories(requireUserId(req));
    res.status(200).json({ categories });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const category = await financeService.createCategory(
      requireUserId(req),
      req.body as CreateFinanceCategoryInput,
    );
    res.status(201).json({ category });
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const category = await financeService.updateCategory(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateFinanceCategoryInput,
    );
    res.status(200).json({ category });
  }

  async removeCategory(req: Request, res: Response): Promise<void> {
    const result = await financeService.removeCategory(
      requireUserId(req),
      req.params.id as string,
    );
    res.status(200).json(result);
  }

  async listOperations(req: Request, res: Response): Promise<void> {
    const result = await financeService.listOperations(
      requireUserId(req),
      req.query as unknown as FinancePeriodQuery,
    );
    res.status(200).json(result);
  }

  async createOperation(req: Request, res: Response): Promise<void> {
    const operation = await financeService.createOperation(
      requireUserId(req),
      req.body as CreateFinanceOperationInput,
    );
    res.status(201).json({ operation });
  }

  async removeOperation(req: Request, res: Response): Promise<void> {
    const result = await financeService.removeOperation(
      requireUserId(req),
      req.params.id as string,
    );
    res.status(200).json(result);
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    const summary = await financeService.getSummary(
      requireUserId(req),
      req.query as unknown as FinancePeriodQuery,
    );
    res.status(200).json(summary);
  }
}

export const financeController = new FinanceController();
