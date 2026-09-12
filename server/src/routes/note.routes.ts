import { Router } from 'express';
import { noteController } from '@/controllers/note.controller.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';
import { requireAuth } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.js';
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteIdParamsSchema,
  updateNoteSchema,
} from '@/validations/note.schemas.js';

export const noteRouter = Router();

noteRouter.use(requireAuth);

noteRouter.get(
  '/',
  validate(listNotesQuerySchema, 'query'),
  asyncHandler((req, res) => noteController.list(req, res)),
);

noteRouter.get(
  '/:id',
  validate(noteIdParamsSchema, 'params'),
  asyncHandler((req, res) => noteController.getById(req, res)),
);

noteRouter.post(
  '/',
  validate(createNoteSchema),
  asyncHandler((req, res) => noteController.create(req, res)),
);

noteRouter.patch(
  '/:id',
  validate(noteIdParamsSchema, 'params'),
  validate(updateNoteSchema),
  asyncHandler((req, res) => noteController.update(req, res)),
);

noteRouter.delete(
  '/:id',
  validate(noteIdParamsSchema, 'params'),
  asyncHandler((req, res) => noteController.remove(req, res)),
);
