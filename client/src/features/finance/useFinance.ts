import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreateOperationPayload } from '@/api/finance';
import type { FinanceCurrency } from '@/features/finance/currencies';
import type { FinancePeriodParams } from '@/types/finance';
import { touchPlanUsage } from '@/features/billing/planLimit';

const financeKey = ['finance'] as const;

export function useFinanceSettings() {
  return useQuery({
    queryKey: [...financeKey, 'settings'],
    queryFn: async () => (await financeApi.getSettings()).settings,
  });
}

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      openingBalance?: number;
      displayCurrency?: FinanceCurrency;
      monthlyLimit?: { currency: FinanceCurrency; amount: number | null };
    }) => financeApi.updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
    },
  });
}

export function useFinanceSummary(params: FinancePeriodParams, enabled = true) {
  return useQuery({
    queryKey: [...financeKey, 'summary', params],
    queryFn: () => financeApi.getSummary(params),
    enabled,
  });
}

export function useFinanceCategories() {
  return useQuery({
    queryKey: [...financeKey, 'categories'],
    queryFn: async () => (await financeApi.listCategories()).categories,
  });
}

export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => financeApi.createCategory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...financeKey, 'categories'] });
      touchPlanUsage(queryClient);
    },
  });
}

export function useUpdateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string } }) =>
      financeApi.updateCategory(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...financeKey, 'categories'] });
    },
  });
}

export function useDeleteFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.removeCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useCreateFinanceOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOperationPayload) => financeApi.createOperation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useBulkCreateFinanceOperations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { operations: CreateOperationPayload[] }) =>
      financeApi.bulkCreateOperations(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
      touchPlanUsage(queryClient);
    },
  });
}

export function useDeleteFinanceOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.removeOperation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
      touchPlanUsage(queryClient);
    },
  });
}
