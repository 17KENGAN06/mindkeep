import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CreateOperationPayload } from '@/api/finance';
import type { FinanceCurrency } from '@/features/finance/currencies';
import type { FinancePeriodParams, FinanceSettings, FinanceSummary } from '@/types/finance';
import { touchPlanUsage } from '@/features/billing/planLimit';

const financeKey = ['finance'] as const;

function patchMonthlyLimit(
  settings: FinanceSettings | undefined,
  monthlyLimit?: { currency: FinanceCurrency; amount: number | null },
): FinanceSettings | undefined {
  if (!settings || !monthlyLimit) return settings;
  const monthlyLimits = { ...(settings.monthlyLimits ?? {}) };
  if (monthlyLimit.amount == null || monthlyLimit.amount <= 0) {
    delete monthlyLimits[monthlyLimit.currency];
  } else {
    monthlyLimits[monthlyLimit.currency] = monthlyLimit.amount;
  }
  return { ...settings, monthlyLimits };
}

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
    onMutate: async (payload) => {
      if (!payload.monthlyLimit) return;
      await queryClient.cancelQueries({ queryKey: financeKey });
      const previous = queryClient.getQueriesData({ queryKey: financeKey });
      queryClient.setQueriesData({ queryKey: [...financeKey, 'summary'] }, (old: FinanceSummary | undefined) => {
        if (!old) return old;
        const settings = patchMonthlyLimit(old.settings, payload.monthlyLimit);
        return settings ? { ...old, settings } : old;
      });
      queryClient.setQueryData([...financeKey, 'settings'], (old: FinanceSettings | undefined) =>
        patchMonthlyLimit(old, payload.monthlyLimit),
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (result) => {
      if (result.settings) {
        queryClient.setQueryData([...financeKey, 'settings'], result.settings);
        queryClient.setQueriesData({ queryKey: [...financeKey, 'summary'] }, (old: FinanceSummary | undefined) =>
          old
            ? {
                ...old,
                settings: {
                  ...old.settings,
                  ...result.settings,
                  monthlyLimits: result.settings.monthlyLimits ?? old.settings.monthlyLimits,
                },
              }
            : old,
        );
      }
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
