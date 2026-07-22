import { useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Loader } from '@/components/ui/Loader';
import { AuthContext } from '@/features/auth/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authApi.me();
        return response.user;
      } catch (error) {
        // 401 = logged out; network/API/DB issues should not block the UI preview.
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginMutation.mutateAsync(payload);
      return result.user;
    },
    [loginMutation],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await registerMutation.mutateAsync(payload);
      return result.user;
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      login,
      register,
      logout,
    }),
    [login, logout, meQuery.data, register],
  );

  if (meQuery.isLoading) {
    return <Loader />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
