import { useCallback, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  type GoogleLoginPayload,
  type LoginPayload,
  type RegisterPayload,
} from '@/api/auth';
import { ApiError } from '@/api/client';
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

  const googleLoginMutation = useMutation({
    mutationFn: authApi.googleLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
  const googleLoginMutateAsync = googleLoginMutation.mutateAsync;

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

  const googleLogin = useCallback(
    async (payload: GoogleLoginPayload) => {
      const result = await googleLoginMutateAsync(payload);
      return result.user;
    },
    [googleLoginMutateAsync],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      login,
      googleLogin,
      register,
      logout,
    }),
    [googleLogin, login, logout, meQuery.data, register],
  );

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="preloader-mark">
          <div className="h-12 w-12 rounded-2xl border border-brand-500/30 border-t-brand-500" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
