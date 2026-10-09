import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  authApi,
  type AppleLoginPayload,
  type GoogleLoginPayload,
  type LoginCodePayload,
  type LoginPayload,
  type RegisterPayload,
} from '../../api/auth';
import { ApiError, NetworkError, refreshAccessToken } from '../../api/client';
import type { User } from '../../types/auth';
import { cancelReminders } from '../notifications/localReminders';
import { AuthContext } from './auth-context';
import {
  clearStoredToken,
  getStoredRefreshToken,
  getStoredToken,
  setStoredToken,
} from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = await getStoredToken();
      const refresh = await getStoredRefreshToken();
      if (!token && !refresh) return null;
      if (!token) {
        const result = await refreshAccessToken();
        if (result === 'invalid') return null;
        // Keep the tokens; the boot screen offers Retry instead of the login form.
        if (result === 'unavailable') throw new NetworkError();
      }
      try {
        const response = await authApi.me();
        return response.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHORIZED') {
          await clearStoredToken();
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const updateWorkspace = useCallback(
    async (payload: { timezone?: string; enabledModules?: string[] }) => {
      const result = await authApi.updateMe(payload);
      queryClient.setQueryData(['auth', 'me'], result.user);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      return result.user;
    },
    [queryClient],
  );

  const completeOnboarding = useCallback(
    async (modules: string[], nutritionMacros?: boolean) => {
      const result = await authApi.completeOnboarding({
        modules,
        ...(nutritionMacros === undefined ? {} : { nutritionMacros }),
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      queryClient.setQueryData(['auth', 'me'], result.user);
      return result.user;
    },
    [queryClient],
  );

  const updateTimezone = useCallback(
    async (timezone: string) => updateWorkspace({ timezone }),
    [updateWorkspace],
  );

  const persistUser = useCallback(
    async (user: User, token?: string, refreshToken?: string) => {
      if (!token) {
        throw new ApiError(503, {
          code: 'MISSING_TOKEN',
          message: 'Access token missing from auth response',
        });
      }
      await setStoredToken(token, refreshToken);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      // The account time zone is never changed silently; TimezoneSuggestion asks first.
      queryClient.setQueryData(['auth', 'me'], user);
      return user;
    },
    [queryClient],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      return authApi.login(payload);
    },
    [],
  );

  const confirmLogin = useCallback(
    async (payload: LoginCodePayload) => {
      const result = await authApi.confirmLogin(payload);
      return persistUser(result.user, result.token, result.refreshToken);
    },
    [persistUser],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    return authApi.register(payload);
  }, []);

  const googleLogin = useCallback(
    async (payload: GoogleLoginPayload) => {
      const result = await authApi.googleLogin(payload);
      return persistUser(result.user, result.token, result.refreshToken);
    },
    [persistUser],
  );

  const appleLogin = useCallback(
    async (payload: AppleLoginPayload) => {
      const result = await authApi.appleLogin(payload);
      return persistUser(result.user, result.token, result.refreshToken);
    },
    [persistUser],
  );

  const logout = useCallback(async () => {
    const refreshToken = (await getStoredRefreshToken()) ?? undefined;
    try {
      await authApi.logout(refreshToken ? { refreshToken } : undefined);
    } catch {
      // Token is cleared locally even if the API is unreachable.
    }
    await clearStoredToken();
    // Reminders scheduled for this account must not fire after it signs out.
    await cancelReminders().catch(() => undefined);
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }, [queryClient]);

  const user = meQuery.data ?? null;
  // Only when the very first session check failed (no cached user): a refetch error keeps the signed-in user.
  const connectionError = meQuery.isError && meQuery.data === undefined ? meQuery.error : null;
  const { refetch: refetchMe } = meQuery;
  const retrySession = useCallback(async () => {
    await refetchMe();
  }, [refetchMe]);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const current = userRef.current;
      if (!current) {
        // Back from airplane mode etc.: retry a session check that failed on the network.
        if (queryClient.getQueryState(['auth', 'me'])?.status === 'error') {
          void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        }
        return;
      }
      // auth/me and billing refetch through focusManager (App.tsx) when stale.
    });
    return () => sub.remove();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: meQuery.isLoading,
      connectionError,
      isRetrying: meQuery.isFetching,
      retrySession,
      login,
      confirmLogin,
      register,
      googleLogin,
      appleLogin,
      completeOnboarding,
      updateTimezone,
      updateWorkspace,
      logout,
    }),
    [appleLogin, completeOnboarding, confirmLogin, connectionError, googleLogin, login, logout, meQuery.isFetching, meQuery.isLoading, register, retrySession, updateTimezone, updateWorkspace, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
