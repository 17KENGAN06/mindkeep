import { apiClient } from '@/api/client';
import type {
  FinanceCategory,
  FinanceCurrency,
  FinanceOperation,
  FinanceOperationType,
  FinancePeriodParams,
  FinanceSettings,
  FinanceSummary,
} from '@/types/finance';

function periodQuery(params: FinancePeriodParams): string {
  const search = new URLSearchParams({
    view: params.view,
    year: String(params.year),
  });
  if (params.view === 'month' && params.month) {
    search.set('month', String(params.month));
  }
  return search.toString();
}

export type CreateOperationPayload = {
  type: FinanceOperationType;
  amount: number;
  currency?: FinanceCurrency;
  date: string;
  comment?: string;
  categoryId?: string | null;
};

export const financeApi = {
  getSettings: () => apiClient.get<{ settings: FinanceSettings }>('/api/finance/settings'),
  updateSettings: (payload: {
    displayCurrency: FinanceCurrency;
    openingBalance?: number;
    openingCurrency?: FinanceCurrency;
  }) => apiClient.patch<{ settings: FinanceSettings }>('/api/finance/settings', payload),
  getSummary: (params: FinancePeriodParams) =>
    apiClient.get<FinanceSummary>(`/api/finance/summary?${periodQuery(params)}`),
  listCategories: () => apiClient.get<{ categories: FinanceCategory[] }>('/api/finance/categories'),
  createCategory: (payload: { name: string }) =>
    apiClient.post<{ category: FinanceCategory }>('/api/finance/categories', payload),
  updateCategory: (id: string, payload: { name: string }) =>
    apiClient.patch<{ category: FinanceCategory }>(`/api/finance/categories/${id}`, payload),
  removeCategory: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/finance/categories/${id}`),
  listOperations: (params: FinancePeriodParams) =>
    apiClient.get<{
      settings: FinanceSettings;
      operations: FinanceOperation[];
    }>(`/api/finance/operations?${periodQuery(params)}`),
  createOperation: (payload: CreateOperationPayload) =>
    apiClient.post<{ operation: FinanceOperation }>('/api/finance/operations', payload),
  removeOperation: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/finance/operations/${id}`),
};
