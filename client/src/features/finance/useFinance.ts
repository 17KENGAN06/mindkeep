import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreateOperationPayload } from '@/api/finance';
import type { FinanceCurrency, FinancePeriodParams } from '@/types/finance';

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
      displayCurrency: FinanceCurrency;
      openingBalance?: number;
      openingCurrency?: FinanceCurrency;
    }) => financeApi.updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
    },
  });
}

export function useFinanceSummary(params: FinancePeriodParams) {
  return useQuery({
    queryKey: [...financeKey, 'summary', params],
    queryFn: () => financeApi.getSummary(params),
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
    },
  });
}

export function useCreateFinanceOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOperationPayload) => financeApi.createOperation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
    },
  });
}

export function useDeleteFinanceOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.removeOperation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: financeKey });
    },
  });
}
