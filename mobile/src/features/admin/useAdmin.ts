import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await adminApi.overview()).overview,
    enabled,
  });
}

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await adminApi.users()).users,
    enabled,
  });
}

export function useAdminUserActivity(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => (await adminApi.userActivity(id!)).activity,
    enabled: enabled && Boolean(id),
  });
}

export function useAdminSubscribers(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: async () => (await adminApi.subscribers()).subscribers,
    enabled,
  });
}

export function useAdminBetaTesters(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'beta-testers'],
    queryFn: async () => (await adminApi.betaTesters()).testers,
    enabled,
  });
}

export function useAdminAudit(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => (await adminApi.audit()).events,
    enabled,
  });
}

export function useSetBetaTester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, betaTester }: { id: string; betaTester: boolean }) => adminApi.setBetaTester(id, betaTester),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}
