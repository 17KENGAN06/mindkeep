import { apiClient } from '@/api/client';

export type AdminActivityModuleId = 'review' | 'tasks' | 'habits' | 'nutrition' | 'finance' | 'notes';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  role: 'USER' | 'ADMIN';
  betaTester: boolean;
  plan: 'FREE' | 'PRO';
  planInterval: 'MONTH' | 'YEAR' | null;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  subscribed: boolean;
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
    email?: string;
    role: 'USER' | 'ADMIN';
    betaTester?: boolean;
    createdAt: string;
  };
  lastActivityAt: string | null;
  summary: {
    modulesUsed: number;
    modulesTotal: number;
    activeDays30: number;
    events7: number;
    events30: number;
  };
  timeline: Array<{ date: string; count: number }>;
  modules: Array<{
    id: AdminActivityModuleId;
    used: boolean;
    count: number;
    extra: Record<string, number>;
    firstAt: string | null;
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
  subscribersTotal: number;
  betaTestersTotal: number;
};

export type AdminAuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'GOOGLE_LOGIN'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'BETA_GRANTED'
  | 'BETA_REVOKED';

export type AdminAuditEvent = {
  id: string;
  action: AdminAuditAction;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

export type AdminSubscriber = {
  id: string;
  name: string;
  email: string;
  planInterval: 'MONTH' | 'YEAR' | null;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

export type AdminBetaTester = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  betaTester?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const adminApi = {
  overview: () => apiClient.get<{ overview: AdminOverview }>('/api/admin/overview'),
  users: () => apiClient.get<{ users: AdminUser[] }>('/api/admin/users'),
  subscribers: () => apiClient.get<{ subscribers: AdminSubscriber[] }>('/api/admin/subscribers'),
  betaTesters: () => apiClient.get<{ testers: AdminBetaTester[] }>('/api/admin/beta-testers'),
  userActivity: (id: string) => apiClient.get<{ activity: AdminUserActivity }>(`/api/admin/users/${id}`),
  setBetaTester: (id: string, betaTester: boolean) =>
    apiClient.patch<{ user: AdminBetaTester }>(`/api/admin/users/${id}/beta`, { betaTester }),
  audit: () => apiClient.get<{ events: AdminAuditEvent[] }>('/api/admin/audit'),
};
