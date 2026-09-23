import { useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  authApi,
  type GoogleLoginPayload,
  type LoginPayload,
  type RegisterPayload,
} from '@/api/auth';
import { AuthContext } from '@/features/auth/auth-context';

function dropUserQueries(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== 'auth',
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authApi.me();
        return response.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      dropUserQueries(queryClient);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      dropUserQueries(queryClient);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      dropUserQueries(queryClient);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
  const googleLoginMutateAsync = googleLoginMutation.mutateAsync;

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

  const googleLogin = useCallback(
    async (payload: GoogleLoginPayload) => {
      const result = await googleLoginMutateAsync(payload);
      return result.user;
    },
    [googleLoginMutateAsync],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Cookie is cleared locally even if the API is unreachable.
    }
    dropUserQueries(queryClient);
    queryClient.setQueryData(['auth', 'me'], null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      isReady: !meQuery.isPending,
      login,
      googleLogin,
      register,
      logout,
    }),
    [googleLogin, login, logout, meQuery.data, meQuery.isPending, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
