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
  pendingPlan: 'PLUS' | 'PRO' | null;
  pendingInterval: 'MONTH' | 'YEAR' | null;
  pendingChangeAt: string | null;
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
  change: (plan: 'plus' | 'pro', interval: 'month' | 'year') =>
    apiClient.post<{ ok: true }>('/api/billing/change', { plan, interval }),
  clearChange: () => apiClient.post<{ ok: true }>('/api/billing/change/clear'),
  cancel: () => apiClient.post<{ ok: true }>('/api/billing/cancel'),
  resume: () => apiClient.post<{ ok: true }>('/api/billing/resume'),
};
