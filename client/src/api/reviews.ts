import { apiClient } from '@/api/client';

export type PublicReview = {
  id: string;
  rating: number;
  text: string;
  location: string | null;
  createdAt: string;
  user: { name: string };
};

export type ReviewEligibility = {
  eligible: boolean;
  completedCount: number;
  requiredCount: number;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

export type SubmitReviewPayload = {
  rating: number;
  text: string;
  location?: string;
};

export const reviewsApi = {
  approved: () => apiClient.get<{ reviews: PublicReview[] }>('/api/reviews'),
  eligibility: () =>
    apiClient.get<{ eligibility: ReviewEligibility }>('/api/reviews/eligibility'),
  submit: (payload: SubmitReviewPayload) =>
    apiClient.post<{ review: unknown }>('/api/reviews', payload),
};
