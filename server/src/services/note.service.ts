import { prisma } from '@/config/prisma.js';
import type {
  CreateNoteInput,
  ListNotesQuery,
  UpdateNoteInput,
} from '@/validations/note.schemas.js';
import { AppError } from '@/utils/AppError.js';

export class NoteService {
  async list(userId: string, query: ListNotesQuery) {
    const search = query.search?.trim();

    return prisma.note.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new AppError('Note not found', {
        statusCode: 404,
        code: 'NOTE_NOT_FOUND',
      });
    }

    return note;
  }

  async create(userId: string, input: CreateNoteInput) {
    return prisma.note.create({
      data: {
        title: input.title,
        content: input.content,
        sourceUrl: input.sourceUrl,
        userId,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateNoteInput) {
    await this.getById(userId, id);

    return prisma.note.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await prisma.note.delete({ where: { id } });
    return { success: true };
  }
}

export const noteService = new NoteService();
