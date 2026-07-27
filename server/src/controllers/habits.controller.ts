import type { Request, Response } from 'express';
import { habitService } from '@/services/habits/habit.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateHabitInput,
  ToggleHabitLogInput,
  UpdateHabitInput,
} from '@/validations/habits.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  return req.user.id;
}

export class HabitsController {
  async list(req: Request, res: Response): Promise<void> {
    const result = await habitService.list(requireUserId(req));
    res.status(200).json(result);
  }

  async create(req: Request, res: Response): Promise<void> {
    const habit = await habitService.create(requireUserId(req), req.body as CreateHabitInput);
    res.status(201).json({ habit });
  }

  async update(req: Request, res: Response): Promise<void> {
    const habit = await habitService.update(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateHabitInput,
    );
    res.status(200).json({ habit });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await habitService.remove(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async toggleLog(req: Request, res: Response): Promise<void> {
    const result = await habitService.toggleLog(
      requireUserId(req),
      req.params.id as string,
      req.body as ToggleHabitLogInput,
    );
    res.status(200).json(result);
  }

  async statistics(req: Request, res: Response): Promise<void> {
    const result = await habitService.getStatistics(requireUserId(req));
    res.status(200).json(result);
  }
}

export const habitsController = new HabitsController();
