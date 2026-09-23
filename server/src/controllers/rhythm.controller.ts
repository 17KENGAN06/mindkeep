import type { Request, Response } from 'express';
import { rhythmService } from '@/services/rhythm.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateHabitInput,
  RhythmPeriodQuery,
  UpdateHabitInput,
  UpsertHabitCheckInput,
} from '@/validations/rhythm.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class RhythmController {
  async listPeriod(req: Request, res: Response): Promise<void> {
    const data = await rhythmService.listPeriod(
      requireUserId(req),
      req.query as unknown as RhythmPeriodQuery,
    );
    res.status(200).json(data);
  }

  async createHabit(req: Request, res: Response): Promise<void> {
    const habit = await rhythmService.createHabit(requireUserId(req), req.body as CreateHabitInput);
    res.status(201).json({ habit });
  }

  async updateHabit(req: Request, res: Response): Promise<void> {
    const habit = await rhythmService.updateHabit(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateHabitInput,
    );
    res.status(200).json({ habit });
  }

  async removeHabit(req: Request, res: Response): Promise<void> {
    const result = await rhythmService.removeHabit(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async upsertCheck(req: Request, res: Response): Promise<void> {
    const check = await rhythmService.upsertCheck(
      requireUserId(req),
      req.body as UpsertHabitCheckInput,
    );
    res.status(200).json({ check });
  }
}

export const rhythmController = new RhythmController();
