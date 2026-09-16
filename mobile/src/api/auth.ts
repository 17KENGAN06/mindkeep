import { apiClient } from './client';
import type { AuthResponse, User } from '../types/auth';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
};

export type GoogleLoginPayload = {
  credential: string;
  timezone?: string;
};

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/api/auth/login', payload),
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/auth/register', payload),
  googleLogin: (payload: GoogleLoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/google', payload),
  me: () => apiClient.get<{ user: User }>('/api/auth/me'),
  updateMe: (payload: { timezone: string }) =>
    apiClient.patch<{ user: User }>('/api/auth/me', payload),
  logout: () => apiClient.post<{ success: boolean }>('/api/auth/logout'),
};
