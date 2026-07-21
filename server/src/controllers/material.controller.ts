import type { Request, Response } from 'express';
import { materialService } from '@/services/material.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateMaterialInput,
  ListMaterialsQuery,
  UpdateMaterialInput,
} from '@/validations/material.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return req.user.id;
}

export class MaterialController {
  async list(req: Request, res: Response): Promise<void> {
    const materials = await materialService.list(
      requireUserId(req),
      req.query as unknown as ListMaterialsQuery,
    );
    res.status(200).json({ materials });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const material = await materialService.getById(requireUserId(req), req.params.id as string);
    res.status(200).json({ material });
  }

  async create(req: Request, res: Response): Promise<void> {
    const material = await materialService.create(
      requireUserId(req),
      req.body as CreateMaterialInput,
    );
    res.status(201).json({ material });
  }

  async update(req: Request, res: Response): Promise<void> {
    const material = await materialService.update(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateMaterialInput,
    );
    res.status(200).json({ material });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await materialService.remove(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }

  async archive(req: Request, res: Response): Promise<void> {
    const material = await materialService.archive(requireUserId(req), req.params.id as string);
    res.status(200).json({ material });
  }
}

export const materialController = new MaterialController();
