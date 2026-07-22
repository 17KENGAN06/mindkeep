import { createContext } from 'react';
import type { GoogleLoginPayload, LoginPayload, RegisterPayload } from '@/api/auth';
import type { User } from '@/types/auth';

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  googleLogin: (payload: GoogleLoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
