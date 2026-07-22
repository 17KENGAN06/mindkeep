import { prisma } from '@/config/prisma.js';
import type { ModerateReviewInput } from '@/validations/admin.schemas.js';

export class AdminService {
  async listUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            materials: true,
            categories: true,
            reminders: true,
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      materialsCount: user._count.materials,
      categoriesCount: user._count.categories,
      remindersCount: user._count.reminders,
      notificationsCount: user._count.notifications,
    }));
  }

  async getOverview() {
    const [usersTotal, materialsTotal, remindersTotal, adminsTotal] = await Promise.all([
      prisma.user.count(),
      prisma.learningMaterial.count(),
      prisma.reviewReminder.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      usersTotal,
      adminsTotal,
      materialsTotal,
      remindersTotal,
    };
  }

  async listReviews() {
    return prisma.userReview.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async moderateReview(id: string, input: ModerateReviewInput) {
    return prisma.userReview.update({
      where: { id },
      data: { status: input.status },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}

export const adminService = new AdminService();
