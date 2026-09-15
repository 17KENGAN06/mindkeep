import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreateOperationPayload } from '../../api/finance';
import type { FinancePeriodParams } from '../../types/finance';

const financeKey = ['finance'] as const;

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { openingBalance?: number }) => financeApi.updateSettings(payload),
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
