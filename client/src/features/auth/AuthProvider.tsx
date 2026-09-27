import { useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  authApi,
  type GoogleLoginPayload,
  type LoginPayload,
  type RegisterPayload,
} from '@/api/auth';
import { AuthContext } from '@/features/auth/auth-context';
import type { User } from '@/types/auth';

const verifyEmailRuns = new Map<string, Promise<User>>();

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

  const applySession = useCallback(
    (user: User) => {
      dropUserQueries(queryClient);
      queryClient.setQueryData(['auth', 'me'], user);
      return user;
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      applySession(data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
  });

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      applySession(data.user);
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
      return registerMutation.mutateAsync(payload);
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

  const verifyEmail = useCallback(
    async (token: string) => {
      const existing = verifyEmailRuns.get(token);
      if (existing) return existing;
      const run = authApi.verifyEmail({ token }).then((result) => applySession(result.user));
      verifyEmailRuns.set(token, run);
      return run;
    },
    [applySession],
  );

  const resetPassword = useCallback(
    async (payload: { token: string; password: string; confirmPassword: string }) => {
      const result = await authApi.resetPassword(payload);
      return applySession(result.user);
    },
    [applySession],
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
      verifyEmail,
      resetPassword,
      logout,
    }),
    [googleLogin, login, logout, meQuery.data, meQuery.isPending, register, resetPassword, verifyEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
