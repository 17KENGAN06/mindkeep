import { createContext } from 'react';
import type { GoogleLoginPayload, LoginCodePayload, LoginPayload, RegisterPayload } from '../../api/auth';
import type { User } from '../../types/auth';

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Set when the first session check failed for a non-auth reason (offline, timeout, server error). */
  connectionError: unknown;
  isRetrying: boolean;
  retrySession: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<{ pending: true }>;
  confirmLogin: (payload: LoginCodePayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<{ pending: true }>;
  googleLogin: (payload: GoogleLoginPayload) => Promise<User>;
  completeOnboarding: (modules: string[], nutritionMacros?: boolean) => Promise<User>;
  updateTimezone: (timezone: string) => Promise<User>;
  updateWorkspace: (payload: { timezone?: string; enabledModules?: string[] }) => Promise<User>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
