import { apiClient } from '@/api/client';
import type { User } from '@/types/auth';

export type BillingUsageItem = {
  used: number;
  limit: number | null;
};

export type BillingStatus = {
  configured: boolean;
  plan: 'FREE' | 'PRO';
  planInterval: 'MONTH' | 'YEAR' | null;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    materials: BillingUsageItem;
    reviewCategories: BillingUsageItem;
    habits: BillingUsageItem;
    notes: BillingUsageItem;
    tasks: BillingUsageItem;
    financeOperations: BillingUsageItem;
    financeCategories: BillingUsageItem;
    sessions: BillingUsageItem;
    meals: BillingUsageItem;
  };
};

export const billingApi = {
  status: () => apiClient.get<BillingStatus>('/api/billing/status'),
  checkout: (interval: 'month' | 'year') =>
    apiClient.post<{ url: string }>('/api/billing/checkout', { interval }),
  portal: () => apiClient.post<{ url: string }>('/api/billing/portal'),
  sync: (sessionId: string) => apiClient.post<{ user: User }>('/api/billing/sync', { sessionId }),
};
