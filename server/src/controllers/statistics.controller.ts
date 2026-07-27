import type { Request, Response } from 'express';
import { statisticsService } from '@/services/statistics.service.js';
import { AppError } from '@/utils/AppError.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return req.user.id;
}

export class StatisticsController {
  async dashboard(req: Request, res: Response): Promise<void> {
    const data = await statisticsService.getDashboard(requireUserId(req));
    res.status(200).json(data);
  }

  async activity(req: Request, res: Response): Promise<void> {
    const data = await statisticsService.getActivity(requireUserId(req));
    res.status(200).json(data);
  }

  async overview(req: Request, res: Response): Promise<void> {
    const data = await statisticsService.getOverview(requireUserId(req));
    res.status(200).json(data);
  }
}

export const statisticsController = new StatisticsController();
