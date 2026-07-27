import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/api/budget';
import type { BudgetCurrency, BudgetOperationType } from '@/types/budget';

export function useBudgetMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['budget', 'month', year, month],
    queryFn: async () => budgetApi.getMonth(year, month),
  });
}

export function useBudgetYear(year: number) {
  return useQuery({
    queryKey: ['budget', 'year', year],
    queryFn: async () => budgetApi.getYear(year),
  });
}

export function useBudgetCategories() {
  return useQuery({
    queryKey: ['budget', 'categories'],
    queryFn: async () => (await budgetApi.listCategories()).categories,
  });
}

export function useUpdateBudgetSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      displayCurrency?: BudgetCurrency;
      openingBalance?: number;
      openingCurrency?: BudgetCurrency;
    }) => budgetApi.updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useCreateBudgetOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      date: string;
      amount: number;
      type: BudgetOperationType;
      comment?: string;
      categoryId?: string | null;
    }) => budgetApi.createOperation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
      void queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useRemoveBudgetOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetApi.removeOperation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useCreateMandatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; dayOfMonth: number; amount: number }) =>
      budgetApi.createMandatory(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useToggleMandatory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      year,
      month,
      paid,
    }: {
      id: string;
      year: number;
      month: number;
      paid: boolean;
    }) => budgetApi.toggleMandatory(id, year, month, paid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useCreatePlannedExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      amount: number;
      targetYear: number;
      targetMonth?: number | null;
    }) => budgetApi.createPlanned(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}
