import type { Request, Response } from 'express';
import { dailyTaskService } from '@/services/dailyTask.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateDailyTaskInput,
  DailyTaskPeriodQuery,
  UpdateDailyTaskInput,
} from '@/validations/dailyTask.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class DailyTaskController {
  async listPeriod(req: Request, res: Response): Promise<void> {
    const result = await dailyTaskService.listByPeriod(
      requireUserId(req),
      req.query as unknown as DailyTaskPeriodQuery,
    );
    res.status(200).json(result);
  }

  async listDay(req: Request, res: Response): Promise<void> {
    const date = String(req.query.date ?? '');
    const result = await dailyTaskService.listByDay(requireUserId(req), date);
    res.status(200).json(result);
  }

  async forest(req: Request, res: Response): Promise<void> {
    const result = await dailyTaskService.getForestSummary(requireUserId(req));
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    const task = await dailyTaskService.create(
      requireUserId(req),
      req.body as CreateDailyTaskInput,
    );
    res.status(201).json({ task });
  }

  async update(req: Request, res: Response): Promise<void> {
    const task = await dailyTaskService.update(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateDailyTaskInput,
    );
    res.status(200).json({ task });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await dailyTaskService.remove(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }
}

export const dailyTaskController = new DailyTaskController();
