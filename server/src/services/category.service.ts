import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/validations/category.schemas.js';
import { AppError } from '@/utils/AppError.js';

export class CategoryService {
  list(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });
  }

  async getById(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', {
        statusCode: 404,
        code: 'CATEGORY_NOT_FOUND',
      });
    }

    return category;
  }

  async create(userId: string, input: CreateCategoryInput) {
    try {
      return await prisma.category.create({
        data: {
          name: input.name,
          userId,
        },
        include: {
          _count: {
            select: { materials: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category with this name already exists', {
          statusCode: 409,
          code: 'CATEGORY_NAME_TAKEN',
        });
      }

      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdateCategoryInput) {
    await this.getById(userId, id);

    try {
      return await prisma.category.update({
        where: { id },
        data: { name: input.name },
        include: {
          _count: {
            select: { materials: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Category with this name already exists', {
          statusCode: 409,
          code: 'CATEGORY_NAME_TAKEN',
        });
      }

      throw error;
    }
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);

    await prisma.category.delete({
      where: { id },
    });

    return { success: true as const };
  }
}

export const categoryService = new CategoryService();
