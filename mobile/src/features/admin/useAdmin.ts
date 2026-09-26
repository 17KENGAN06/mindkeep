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

export function useAdminReviews(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: async () => (await adminApi.reviews()).reviews,
    enabled,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      adminApi.moderateReview(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });
}
