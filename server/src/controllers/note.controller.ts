import type { Request, Response } from 'express';
import { noteService } from '@/services/note.service.js';
import { AppError } from '@/utils/AppError.js';
import type {
  CreateNoteInput,
  ListNotesQuery,
  UpdateNoteInput,
} from '@/validations/note.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new AppError('Authentication required', {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }
  return req.user.id;
}

export class NoteController {
  async list(req: Request, res: Response): Promise<void> {
    const notes = await noteService.list(
      requireUserId(req),
      req.query as unknown as ListNotesQuery,
    );
    res.status(200).json({ notes });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const note = await noteService.getById(requireUserId(req), req.params.id as string);
    res.status(200).json({ note });
  }

  async create(req: Request, res: Response): Promise<void> {
    const note = await noteService.create(requireUserId(req), req.body as CreateNoteInput);
    res.status(201).json({ note });
  }

  async update(req: Request, res: Response): Promise<void> {
    const note = await noteService.update(
      requireUserId(req),
      req.params.id as string,
      req.body as UpdateNoteInput,
    );
    res.status(200).json({ note });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await noteService.remove(requireUserId(req), req.params.id as string);
    res.status(200).json(result);
  }
}

export const noteController = new NoteController();
