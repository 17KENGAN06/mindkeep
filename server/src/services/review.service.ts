import { ReminderStatus, UserReviewStatus } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import type { SubmitReviewInput } from '@/validations/review.schemas.js';
import { AppError } from '@/utils/AppError.js';

const REQUIRED_COMPLETED_REVIEWS = 20;

export class ReviewService {
  async listApproved() {
    return prisma.userReview.findMany({
      where: { status: UserReviewStatus.APPROVED },
      select: {
        id: true,
        rating: true,
        text: true,
        location: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async eligibility(userId: string) {
    const [completedCount, existing] = await Promise.all([
      prisma.reviewReminder.count({
        where: { userId, status: ReminderStatus.COMPLETED },
      }),
      prisma.userReview.findUnique({
        where: { userId },
        select: { status: true },
      }),
    ]);

    return {
      eligible: completedCount >= REQUIRED_COMPLETED_REVIEWS,
      completedCount,
      requiredCount: REQUIRED_COMPLETED_REVIEWS,
      reviewStatus: existing?.status ?? null,
    };
  }

  async submit(userId: string, input: SubmitReviewInput) {
    const eligibility = await this.eligibility(userId);
    if (!eligibility.eligible) {
      throw new AppError('Complete more reviews before leaving feedback', {
        statusCode: 403,
        code: 'REVIEW_NOT_ELIGIBLE',
        details: eligibility,
      });
    }

    if (eligibility.reviewStatus === UserReviewStatus.PENDING) {
      throw new AppError('Your review is already awaiting moderation', {
        statusCode: 409,
        code: 'REVIEW_ALREADY_PENDING',
      });
    }
    if (eligibility.reviewStatus === UserReviewStatus.APPROVED) {
      throw new AppError('Your review is already published', {
        statusCode: 409,
        code: 'REVIEW_ALREADY_APPROVED',
      });
    }

    return prisma.userReview.upsert({
      where: { userId },
      create: {
        userId,
        rating: input.rating,
        text: input.text,
        location: input.location || null,
      },
      update: {
        rating: input.rating,
        text: input.text,
        location: input.location || null,
        status: UserReviewStatus.PENDING,
      },
    });
  }
}

export const reviewService = new ReviewService();
