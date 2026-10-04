import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { authApi, type GoogleLoginPayload, type LoginCodePayload, type LoginPayload, type RegisterPayload } from '../../api/auth';
import { ApiError, refreshAccessToken } from '../../api/client';
import { detectDeviceTimezone } from '../../config/timezones';
import type { User } from '../../types/auth';
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
      let token = await getStoredToken();
      const refresh = await getStoredRefreshToken();
      if (!token && refresh) {
        const ok = await refreshAccessToken();
        if (!ok) return null;
        token = await getStoredToken();
      }
      if (!token) return null;
      try {
        const response = await authApi.me();
        return response.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
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
    async (modules: string[]) => {
      const result = await authApi.completeOnboarding({ modules });
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

  const applyDeviceTimezone = useCallback(
    async (user: User) => {
      const timezone = detectDeviceTimezone();
      if (!timezone || timezone === user.timezone) return user;
      try {
        return await updateTimezone(timezone);
      } catch {
        return user;
      }
    },
    [updateTimezone],
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
      const synced = await applyDeviceTimezone(user);
      queryClient.setQueryData(['auth', 'me'], synced);
      return synced;
    },
    [applyDeviceTimezone, queryClient],
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

  const logout = useCallback(async () => {
    const refreshToken = (await getStoredRefreshToken()) ?? undefined;
    try {
      await authApi.logout(refreshToken ? { refreshToken } : undefined);
    } catch {
      // Token is cleared locally even if the API is unreachable.
    }
    await clearStoredToken();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }, [queryClient]);

  const user = meQuery.data ?? null;
  const userRef = useRef(user);
  userRef.current = user;
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (syncingRef.current) return;
    const timezone = detectDeviceTimezone();
    if (!timezone || timezone === user.timezone) return;
    syncingRef.current = true;
    void applyDeviceTimezone(user).finally(() => {
      syncingRef.current = false;
    });
  }, [applyDeviceTimezone, user?.id, user?.timezone]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const current = userRef.current;
      if (!current) return;
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
      if (syncingRef.current) return;
      const timezone = detectDeviceTimezone();
      if (!timezone || timezone === current.timezone) return;
      syncingRef.current = true;
      void applyDeviceTimezone(current).finally(() => {
        syncingRef.current = false;
      });
    });
    return () => sub.remove();
  }, [applyDeviceTimezone, queryClient]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: meQuery.isLoading,
      login,
      confirmLogin,
      register,
      googleLogin,
      completeOnboarding,
      updateTimezone,
      updateWorkspace,
      logout,
    }),
    [completeOnboarding, confirmLogin, googleLogin, login, logout, meQuery.isLoading, register, updateTimezone, updateWorkspace, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
