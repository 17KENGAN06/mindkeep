import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, type ReactNode } from 'react';
import { authApi, type LoginPayload, type RegisterPayload } from '../../api/auth';
import { ApiError } from '../../api/client';
import type { User } from '../../types/auth';
import { AuthContext } from './auth-context';
import { clearStoredToken, getStoredToken, setStoredToken } from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = await getStoredToken();
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

  const persistUser = useCallback(
    async (user: User, token?: string) => {
      if (!token) {
        throw new ApiError(503, {
          code: 'MISSING_TOKEN',
          message: 'Access token missing from auth response',
        });
      }
      await setStoredToken(token);
      queryClient.setQueryData(['auth', 'me'], user);
      return user;
    },
    [queryClient],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await authApi.login(payload);
      return persistUser(result.user, result.token);
    },
    [persistUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await authApi.register(payload);
      return persistUser(result.user, result.token);
    },
    [persistUser],
  );

  const updateTimezone = useCallback(
    async (timezone: string) => {
      const result = await authApi.updateMe({ timezone });
      queryClient.setQueryData(['auth', 'me'], result.user);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      return result.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Token is cleared locally even if the API is unreachable.
    }
    await clearStoredToken();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      isLoading: meQuery.isLoading,
      login,
      register,
      updateTimezone,
      logout,
    }),
    [login, logout, meQuery.data, meQuery.isLoading, register, updateTimezone],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
