import { apiClient } from '@/api/client';
import type { User } from '@/types/auth';

export type BillingUsageItem = {
  used: number;
  limit: number | null;
};

export type BillingStatus = {
  configured: boolean;
  plan: 'FREE' | 'PLUS' | 'PRO';
  plusConfigured: boolean;
  planInterval: 'MONTH' | 'YEAR' | null;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  subscribed: boolean;
  betaTester: boolean;
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
  checkout: (interval: 'month' | 'year', plan: 'plus' | 'pro' = 'pro') =>
    apiClient.post<{ url: string }>('/api/billing/checkout', { interval, plan }),
  portal: () => apiClient.post<{ url: string }>('/api/billing/portal'),
  sync: (sessionId: string) => apiClient.post<{ user: User }>('/api/billing/sync', { sessionId }),
};
