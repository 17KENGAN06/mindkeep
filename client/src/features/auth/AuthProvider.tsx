import { useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  authApi,
  type GoogleLoginPayload,
  type LoginCodePayload,
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
  });

  const confirmLoginMutation = useMutation({
    mutationFn: authApi.confirmLogin,
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
      return loginMutation.mutateAsync(payload);
    },
    [loginMutation],
  );

  const confirmLogin = useCallback(
    async (payload: LoginCodePayload) => {
      const result = await confirmLoginMutation.mutateAsync(payload);
      return result.user;
    },
    [confirmLoginMutation],
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

  const completeOnboarding = useCallback(
    async (modules: string[]) => {
      const result = await authApi.completeOnboarding({ modules });
      return applySession(result.user);
    },
    [applySession],
  );

  const updateWorkspace = useCallback(
    async (payload: { timezone?: string; enabledModules?: string[] }) => {
      const result = await authApi.updateMe(payload);
      return applySession(result.user);
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
      confirmLogin,
      googleLogin,
      register,
      verifyEmail,
      completeOnboarding,
      updateWorkspace,
      resetPassword,
      logout,
    }),
    [completeOnboarding, confirmLogin, googleLogin, login, logout, meQuery.data, meQuery.isPending, register, resetPassword, updateWorkspace, verifyEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
