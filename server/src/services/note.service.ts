import { prisma } from '@/config/prisma.js';
import type {
  CreateNoteInput,
  ListNotesQuery,
  UpdateNoteInput,
} from '@/validations/note.schemas.js';
import { requireDeleted, requireOwned } from '@/utils/owned.js';
import { assertCreateLimit } from '@/services/entitlements.service.js';

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
    return requireOwned(
      await prisma.note.findFirst({
        where: { id, userId },
      }),
      'Note not found',
      'NOTE_NOT_FOUND',
    );
  }

  async create(userId: string, input: CreateNoteInput) {
    await assertCreateLimit(userId, 'notes');
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
    const result = await prisma.note.deleteMany({ where: { id, userId } });
    requireDeleted(result.count, 'Note not found', 'NOTE_NOT_FOUND');
    return { success: true };
  }
}

export const noteService = new NoteService();
