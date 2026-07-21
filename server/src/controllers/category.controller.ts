import type { Request, Response } from 'express';
import { categoryService } from '@/services/category.service.js';
import { AppError } from '@/utils/AppError.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/validations/category.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return req.user.id;
}

export class CategoryController {
  async list(req: Request, res: Response): Promise<void> {
    const categories = await categoryService.list(requireUserId(req));
    res.status(200).json({ categories });
  }

  async create(req: Request, res: Response): Promise<void> {
    const category = await categoryService.create(
      requireUserId(req),
      req.body as CreateCategoryInput,
    );
    res.status(201).json({ category });
  }

  async update(req: Request, res: Response): Promise<void> {
    const category = await categoryService.update(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateCategoryInput,
    );
    res.status(200).json({ category });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await categoryService.remove(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }
}

export const categoryController = new CategoryController();
