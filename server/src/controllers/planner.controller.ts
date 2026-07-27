import type { Request, Response } from 'express';
import { taskService } from '@/services/planner/task.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateTaskCategoryInput,
  CreateTaskInput,
  ListOccurrencesQuery,
  UpdateTaskInput,
} from '@/validations/planner.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  return req.user.id;
}

export class PlannerController {
  async listCategories(req: Request, res: Response): Promise<void> {
    const categories = await taskService.listCategories(requireUserId(req));
    res.status(200).json({ categories });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const category = await taskService.createCategory(
      requireUserId(req),
      req.body as CreateTaskCategoryInput,
    );
    res.status(201).json({ category });
  }

  async removeCategory(req: Request, res: Response): Promise<void> {
    const result = await taskService.removeCategory(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async createTask(req: Request, res: Response): Promise<void> {
    const task = await taskService.createTask(requireUserId(req), req.body as CreateTaskInput);
    res.status(201).json({ task });
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    const task = await taskService.updateTask(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateTaskInput,
    );
    res.status(200).json({ task });
  }

  async removeTask(req: Request, res: Response): Promise<void> {
    const result = await taskService.removeTask(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async listOccurrences(req: Request, res: Response): Promise<void> {
    const result = await taskService.listOccurrences(
      requireUserId(req),
      req.query as unknown as ListOccurrencesQuery,
    );
    res.status(200).json(result);
  }

  async completeOccurrence(req: Request, res: Response): Promise<void> {
    const occurrence = await taskService.completeOccurrence(
      requireUserId(req),
      req.params.id as string,
    );
    res.status(200).json({ occurrence });
  }

  async rescheduleOccurrence(req: Request, res: Response): Promise<void> {
    const occurrence = await taskService.rescheduleOccurrence(
      requireUserId(req),
      req.params.id as string,
      (req.body as { dueDate: string }).dueDate,
    );
    res.status(200).json({ occurrence });
  }

  async removeOccurrence(req: Request, res: Response): Promise<void> {
    const result = await taskService.removeOccurrence(
      requireUserId(req),
      req.params.id as string,
    );
    res.status(200).json(result);
  }

  async statistics(req: Request, res: Response): Promise<void> {
    const result = await taskService.getStatistics(requireUserId(req));
    res.status(200).json(result);
  }
}

export const plannerController = new PlannerController();
