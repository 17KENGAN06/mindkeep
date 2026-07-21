import { apiClient } from '@/api/client';
import type { AuthResponse, User } from '@/types/auth';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = {
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/api/auth/register', payload),
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/api/auth/login', payload),
  logout: () => apiClient.post<{ success: boolean }>('/api/auth/logout'),
  me: () => apiClient.get<{ user: User }>('/api/auth/me'),
};
