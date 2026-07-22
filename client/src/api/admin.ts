import { apiClient } from '@/api/client';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  materialsCount: number;
  categoriesCount: number;
  remindersCount: number;
  notificationsCount: number;
};

export type AdminOverview = {
  usersTotal: number;
  adminsTotal: number;
  materialsTotal: number;
  remindersTotal: number;
};

export const adminApi = {
  overview: () => apiClient.get<{ overview: AdminOverview }>('/api/admin/overview'),
  users: () => apiClient.get<{ users: AdminUser[] }>('/api/admin/users'),
};
