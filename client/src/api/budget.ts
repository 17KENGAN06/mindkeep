import { apiClient } from '@/api/client';
import type {
  BudgetCategory,
  BudgetCurrency,
  BudgetOperation,
  BudgetOperationType,
  BudgetSettings,
  MandatoryPaymentRow,
  MonthOverview,
  YearMonthRow,
} from '@/types/budget';

export const budgetApi = {
  getSettings: () =>
    apiClient.get<{
      settings: BudgetSettings;
      fx: { asOf: string; rates: Record<BudgetCurrency, number> };
    }>('/api/budget/settings'),
  updateSettings: (payload: Partial<BudgetSettings>) =>
    apiClient.patch<{ settings: BudgetSettings }>('/api/budget/settings', payload),

  listCategories: () => apiClient.get<{ categories: BudgetCategory[] }>('/api/budget/categories'),
  createCategory: (name: string) =>
    apiClient.post<{ category: BudgetCategory }>('/api/budget/categories', { name }),

  getMonth: (year: number, month: number) =>
    apiClient.get<{
      overview: MonthOverview;
      operations: BudgetOperation[];
      mandatory: MandatoryPaymentRow[];
      displayCurrency: BudgetCurrency;
      fx: { asOf: string };
      settings: BudgetSettings;
    }>(`/api/budget/month?year=${year}&month=${month}`),

  getYear: (year: number) =>
    apiClient.get<{
      months: YearMonthRow[];
      totals: YearMonthRow & { closingBalance: number };
      openingBalance: number;
      plannedNextYear: Array<{
        id: string;
        name: string;
        amountDisplay: number;
        targetMonth: number | null;
      }>;
      displayCurrency: BudgetCurrency;
      fx: { asOf: string };
    }>(`/api/budget/year?year=${year}`),

  createOperation: (payload: {
    date: string;
    amount: number;
    type: BudgetOperationType;
    comment?: string;
    categoryId?: string | null;
    currency?: BudgetCurrency;
  }) => apiClient.post<{ operation: BudgetOperation }>('/api/budget/operations', payload),

  removeOperation: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/budget/operations/${id}`),

  createMandatory: (payload: {
    name: string;
    dayOfMonth: number;
    amount: number;
    currency?: BudgetCurrency;
  }) => apiClient.post<{ payment: unknown }>('/api/budget/mandatory', payload),

  toggleMandatory: (id: string, year: number, month: number, paid: boolean) =>
    apiClient.post<{ check: unknown }>(`/api/budget/mandatory/${id}/toggle`, {
      year,
      month,
      paid,
    }),

  removeMandatory: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/budget/mandatory/${id}`),

  createPlanned: (payload: {
    name: string;
    amount: number;
    targetYear: number;
    targetMonth?: number | null;
    currency?: BudgetCurrency;
  }) => apiClient.post<{ planned: unknown }>('/api/budget/planned', payload),

  removePlanned: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/budget/planned/${id}`),
};
