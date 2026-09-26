import { apiClient } from '@/api/client';

export type AdminActivityModuleId = 'review' | 'tasks' | 'habits' | 'nutrition' | 'finance' | 'notes';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  materialsCount: number;
  remindersCount: number;
  lastActivityAt?: string | null;
  modules?: AdminActivityModuleId[];
};

export type AdminUserActivity = {
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
  };
  lastActivityAt: string | null;
  modules: Array<{
    id: AdminActivityModuleId;
    used: boolean;
    count: number;
    extra: Record<string, number>;
    lastAt: string | null;
  }>;
  recent: Array<{
    at: string;
    module: AdminActivityModuleId;
    action: 'created' | 'completed' | 'logged' | 'checked';
  }>;
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
  userActivity: (id: string) => apiClient.get<{ activity: AdminUserActivity }>(`/api/admin/users/${id}`),
  reviews: () => apiClient.get<{ reviews: AdminReview[] }>('/api/admin/reviews'),
  moderateReview: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<{ review: AdminReview }>(`/api/admin/reviews/${id}`, { status }),
};
