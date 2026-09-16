import { apiClient } from './client';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  materialsCount: number;
  remindersCount: number;
};

export type AdminOverview = {
  usersTotal: number;
  adminsTotal: number;
  materialsTotal: number;
  remindersTotal: number;
};

export type AdminReview = {
  id: string;
  rating: number;
  text: string;
  location: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: { name: string; email: string };
};

export const adminApi = {
  overview: () => apiClient.get<{ overview: AdminOverview }>('/api/admin/overview'),
  users: () => apiClient.get<{ users: AdminUser[] }>('/api/admin/users'),
  reviews: () => apiClient.get<{ reviews: AdminReview[] }>('/api/admin/reviews'),
  moderateReview: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<{ review: AdminReview }>(`/api/admin/reviews/${id}`, { status }),
};
