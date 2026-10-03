import { useQuery } from '@tanstack/react-query';
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
